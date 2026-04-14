import { createHmac, timingSafeEqual } from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ── 1. Verificar firma HMAC-SHA256 de MercadoPago ─────────────────────────
    const xSignature  = req.headers["x-signature"];
    const xRequestId  = req.headers["x-request-id"] || "";
    const dataId      = req.query?.["data.id"] || req.body?.data?.id;
    const MP_SECRET   = process.env.MP_WEBHOOK_SECRET;

    if (!dataId) {
      return res.status(200).json({ received: true });
    }

    if (xSignature && MP_SECRET) {
      const sigParts = {};
      xSignature.split(",").forEach(part => {
        const idx = part.trim().indexOf("=");
        if (idx > -1) {
          sigParts[part.trim().slice(0, idx)] = part.trim().slice(idx + 1);
        }
      });

      if (sigParts.ts && sigParts.v1) {
        // Anti-replay: rechazar si tiene más de 5 minutos
        const tsAge = Date.now() - parseInt(sigParts.ts) * 1000;
        if (tsAge > 300000) {
          return res.status(401).json({ error: "Request expirado" });
        }

        // Verificar firma
        const manifest     = `id:${dataId};request-id:${xRequestId};ts:${sigParts.ts};`;
        const expected     = createHmac("sha256", MP_SECRET).update(manifest).digest("hex");
        const expectedBuf  = Buffer.from(expected, "hex");
        const receivedBuf  = Buffer.from(sigParts.v1, "hex");

        // timingSafeEqual evita timing attacks
        if (
          expectedBuf.length !== receivedBuf.length ||
          !timingSafeEqual(expectedBuf, receivedBuf)
        ) {
          console.error("Webhook MP: firma invalida");
          return res.status(401).json({ error: "Firma invalida" });
        }
      }
    }

    // ── 2. Procesar solo pagos ────────────────────────────────────────────────
    const { type, data } = req.body || {};
    if (type !== "payment") {
      return res.status(200).json({ received: true });
    }

    const paymentId = data?.id || dataId;

    // ── 3. Verificar pago en MercadoPago ──────────────────────────────────────
    const paymentRes = await fetch(
      "https://api.mercadopago.com/v1/payments/" + paymentId,
      { headers: { "Authorization": "Bearer " + process.env.MP_ACCESS_TOKEN } }
    );

    if (!paymentRes.ok) {
      return res.status(200).json({ received: true });
    }

    const payment = await paymentRes.json();

    if (payment.status !== "approved") {
      return res.status(200).json({ received: true });
    }

    // ── 4. Validar external_reference ────────────────────────────────────────
    const extRef   = String(payment.external_reference || "");
    const pipeIdx  = extRef.indexOf("|");

    if (pipeIdx === -1) {
      console.error("Webhook MP: external_reference invalido");
      return res.status(200).json({ received: true });
    }

    const userId = extRef.slice(0, pipeIdx);
    const plan   = extRef.slice(pipeIdx + 1).toLowerCase().trim();

    if (!userId || userId.length < 10) {
      console.error("Webhook MP: userId invalido");
      return res.status(200).json({ received: true });
    }

    // ── 5. Validar plan ───────────────────────────────────────────────────────
    const LIMITES  = { emprendedor: 100, pro: 500 };
    const limite   = LIMITES[plan];

    if (!limite) {
      console.error("Webhook MP: plan desconocido");
      return res.status(200).json({ received: true });
    }

    // ── 6. Idempotencia ───────────────────────────────────────────────────────
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Webhook MP: variables Supabase no configuradas");
      return res.status(200).json({ received: true });
    }

    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=subscription_id`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );

    if (checkRes.ok) {
      const profiles = await checkRes.json();
      if (profiles[0]?.subscription_id === String(paymentId)) {
        return res.status(200).json({ received: true });
      }
    }

    // ── 7. Actualizar Supabase ────────────────────────────────────────────────
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          plan,
          generaciones_limite: limite,
          subscription_status: "active",
          payment_provider: "mercadopago",
          subscription_id: String(paymentId),
        }),
      }
    );

    if (!updateRes.ok) {
      console.error("Webhook MP: error actualizando Supabase:", updateRes.status);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("Webhook MP: excepcion inesperada");
    return res.status(200).json({ received: true });
  }
}
