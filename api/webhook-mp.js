import { createHmac } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // ── 1. Verificar firma HMAC-SHA256 ───────────────────────────────────────
    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"] || "";
    const dataId     = req.query?.["data.id"] || req.body?.data?.id;
    const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

    if (xSignature && dataId && MP_WEBHOOK_SECRET) {
      const sigParts = {};
      xSignature.split(",").forEach(part => {
        const idx = part.trim().indexOf("=");
        if (idx > -1) {
          const k = part.trim().slice(0, idx);
          const v = part.trim().slice(idx + 1);
          sigParts[k] = v;
        }
      });

      if (sigParts.ts && sigParts.v1) {
        // Anti-replay: rechazar si tiene mas de 5 minutos
        const tsAge = Date.now() - parseInt(sigParts.ts) * 1000;
        if (tsAge > 300000) {
          console.error("Webhook MP: request expirado, age:", tsAge);
          return res.status(401).json({ error: "Request expirado" });
        }

        const manifest = "id:" + dataId + ";request-id:" + xRequestId + ";ts:" + sigParts.ts + ";";
        const expectedSig = createHmac("sha256", MP_WEBHOOK_SECRET)
          .update(manifest)
          .digest("hex");

        if (expectedSig !== sigParts.v1) {
          console.error("Webhook MP: firma invalida");
          return res.status(401).json({ error: "Firma invalida" });
        }
      }
    } else if (!dataId) {
      console.error("Webhook MP: dataId faltante");
      return res.status(200).json({ received: true });
    }

    // ── 2. Procesar solo eventos de pago ─────────────────────────────────────
    const { type, data } = req.body;
    if (type !== "payment") {
      return res.status(200).json({ received: true });
    }

    const paymentId = data?.id || dataId;
    if (!paymentId) {
      console.error("Webhook MP: sin payment ID");
      return res.status(200).json({ received: true });
    }

    // ── 3. Consultar el pago en MercadoPago ──────────────────────────────────
    const paymentRes = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
      headers: { "Authorization": "Bearer " + process.env.MP_ACCESS_TOKEN },
    });

    if (!paymentRes.ok) {
      console.error("Webhook MP: error consultando pago, status:", paymentRes.status);
      return res.status(200).json({ received: true });
    }

    const payment = await paymentRes.json();
    console.log("Webhook MP: pago status:", payment.status, "ref:", payment.external_reference);

    if (payment.status !== "approved") {
      return res.status(200).json({ received: true });
    }

    // ── 4. Validar external_reference ────────────────────────────────────────
    const extRef = payment.external_reference || "";
    const refParts = extRef.split("|");

    if (refParts.length !== 2) {
      console.error("Webhook MP: external_reference mal formado:", extRef);
      return res.status(200).json({ received: true });
    }

    const [userId, plan] = refParts;

    if (!userId || !plan || userId.length < 10) {
      console.error("Webhook MP: userId o plan invalido:", userId, plan);
      return res.status(200).json({ received: true });
    }

    // ── 5. Validar plan conocido ──────────────────────────────────────────────
    const LIMITES = { emprendedor: 100, pro: 500 };
    const planKey = plan.toLowerCase().trim();
    const limite  = LIMITES[planKey];

    if (!limite) {
      console.error("Webhook MP: plan desconocido:", planKey);
      return res.status(200).json({ received: true });
    }

    // ── 6. Idempotencia — evitar doble procesamiento ──────────────────────────
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    const checkRes = await fetch(
      SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId + "&select=subscription_id",
      { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
    );

    if (checkRes.ok) {
      const profiles = await checkRes.json();
      if (profiles[0]?.subscription_id === String(paymentId)) {
        console.log("Webhook MP: pago ya procesado:", paymentId);
        return res.status(200).json({ received: true });
      }
    }

    // ── 7. Actualizar Supabase ────────────────────────────────────────────────
    const updateRes = await fetch(
      SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId,
      {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          plan: planKey,
          generaciones_limite: limite,
          subscription_status: "active",
          payment_provider: "mercadopago",
          subscription_id: String(paymentId),
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("Webhook MP: error actualizando Supabase:", updateRes.status, errText);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    console.log("Webhook MP: plan actualizado correctamente:", userId, planKey);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook MP: error inesperado:", error.message, error.stack);
    return res.status(200).json({ received: true }); // siempre 200 para que MP no reintente
  }
}
