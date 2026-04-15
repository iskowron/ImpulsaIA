// api/webhook-mp.js
// C-02 HARDENED: Verificación criptográfica de firma MercadoPago
// Sin esta verificación cualquiera puede simular un pago aprobado → fraude

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const PLAN_LIMITS = {
  emprendedor: { limite: 100,   plan: "emprendedor" },
  pro:         { limite: 500,   plan: "pro" },
  agencia:     { limite: 99999, plan: "agencia" },
};

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Verificar firma HMAC-SHA256 de MercadoPago
// Documentación: https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
function verifyMPSignature(req) {
  const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

  // Si no hay secret configurado, loggear advertencia pero no bloquear
  // (permite setup inicial sin romper el flujo)
  if (!MP_WEBHOOK_SECRET) {
    console.warn("[webhook-mp] ⚠️  MP_WEBHOOK_SECRET no configurado — saltando verificación de firma");
    return true;
  }

  const signatureHeader = req.headers["x-signature"];
  const requestId       = req.headers["x-request-id"];

  if (!signatureHeader) {
    console.error("[webhook-mp] Header x-signature ausente");
    return false;
  }

  // Extraer ts y v1 del header: "ts=1234567890,v1=abc123..."
  const tsMatch = signatureHeader.match(/ts=(\d+)/);
  const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/);

  if (!tsMatch || !v1Match) {
    console.error("[webhook-mp] Formato de x-signature inválido:", signatureHeader);
    return false;
  }

  const ts = tsMatch[1];
  const v1 = v1Match[1];

  // Prevenir replay attacks: rechazar notificaciones con más de 5 minutos de antigüedad
  const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (ageSeconds > 300) {
    console.error(`[webhook-mp] Notificación expirada — antigüedad: ${ageSeconds}s`);
    return false;
  }

  // Construir el mensaje a verificar según spec de MP
  const dataId = req.body?.data?.id || "";
  const message = `id:${dataId};request-id:${requestId || ""};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", MP_WEBHOOK_SECRET)
    .update(message)
    .digest("hex");

  // Comparación en tiempo constante para prevenir timing attacks
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(v1, "hex");

  if (expectedBuf.length !== receivedBuf.length) {
    console.error("[webhook-mp] Firma inválida — longitud diferente");
    return false;
  }

  const valid = crypto.timingSafeEqual(expectedBuf, receivedBuf);
  if (!valid) console.error("[webhook-mp] Firma inválida — hash no coincide");
  return valid;
}

// ── Obtener detalles del pago desde la API de MP para verificar estado real
async function getPaymentFromMP(paymentId) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP API error ${res.status}`);
  return res.json();
}

// ── Actualizar plan del usuario en Supabase
async function activatePlan(userId, planKey) {
  const planData = PLAN_LIMITS[planKey];
  if (!planData) {
    console.error(`[webhook-mp] Plan desconocido: ${planKey}`);
    return;
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      plan:                  planData.plan,
      generaciones_limite:   planData.limite,
      subscription_status:   "active",
      payment_provider:      "mercadopago",
      updated_at:            new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error(`[webhook-mp] Error actualizando perfil de ${userId}:`, error.message);
  } else {
    console.log(`[webhook-mp] ✅ Plan ${planKey} activado para userId: ${userId}`);
  }
}

export default async function handler(req, res) {
  // MercadoPago espera 200 rápido — siempre responder antes de procesar
  // para evitar que MP reintente innecesariamente
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── C-02: Verificar firma criptográfica
  if (!verifyMPSignature(req)) {
    console.error("[webhook-mp] ⚠️  REQUEST RECHAZADO — firma inválida o ausente");
    // Responder 200 para evitar que MP reintente (eso revelaría info)
    return res.status(200).json({ received: true });
  }

  const { type, action, data } = req.body || {};
  console.log(`[webhook-mp] Notificación recibida — type: ${type} | action: ${action} | id: ${data?.id}`);

  // Solo procesar eventos de pago aprobado
  if (type !== "payment") {
    return res.status(200).json({ received: true, skipped: "not a payment event" });
  }

  try {
    // ── CRÍTICO: Nunca confiar en el body del webhook para el estado del pago.
    // Siempre consultar la API de MP directamente para obtener el estado real.
    const payment = await getPaymentFromMP(data.id);

    console.log(`[webhook-mp] Payment ${data.id} — status: ${payment.status} | ref: ${payment.external_reference}`);

    if (payment.status !== "approved") {
      return res.status(200).json({ received: true, skipped: `payment status: ${payment.status}` });
    }

    // external_reference tiene formato "userId|planKey" (definido en mp-checkout.js)
    const [userId, planKey] = (payment.external_reference || "").split("|");
    if (!userId || !planKey) {
      console.error("[webhook-mp] external_reference inválido:", payment.external_reference);
      return res.status(200).json({ received: true, error: "invalid external_reference" });
    }

    await activatePlan(userId, planKey);

  } catch (err) {
    console.error("[webhook-mp] Error procesando pago:", err.message);
    // Responder 200 de todas formas — MP interpretaría un 5xx como "reintentar"
  }

  return res.status(200).json({ received: true });
}
