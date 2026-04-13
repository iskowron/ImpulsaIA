import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── 1. Verificar firma HMAC-SHA256 de MercadoPago ────────────────────────
  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];
  const dataId     = req.query?.["data.id"] || req.body?.data?.id;

  if (!xSignature || !dataId) {
    return res.status(401).json({ error: "Firma o datos faltantes" });
  }

  const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;
  if (!MP_WEBHOOK_SECRET) {
    console.error("MP_WEBHOOK_SECRET no configurado");
    return res.status(500).json({ error: "Error de configuracion" });
  }

  // Extraer ts y v1 del header x-signature
  const sigParts = {};
  xSignature.split(",").forEach(part => {
    const [k, v] = part.trim().split("=");
    sigParts[k] = v;
  });

  if (!sigParts.ts || !sigParts.v1) {
    return res.status(401).json({ error: "Formato de firma invalido" });
  }

  // Construir el manifest para verificar
  const manifest = "id:" + dataId + ";request-id:" + (xRequestId || "") + ";ts:" + sigParts.ts + ";";
  const expectedSig = crypto
    .createHmac("sha256", MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");

  if (expectedSig !== sigParts.v1) {
    console.error("Firma MP invalida. Expected:", expectedSig, "Got:", sigParts.v1);
    return res.status(401).json({ error: "Firma invalida" });
  }

  // ── 2. Verificar que el timestamp no sea muy viejo (replay attack) ────────
  const tsAge = Date.now() - parseInt(sigParts.ts) * 1000;
  if (tsAge > 300000) { // 5 minutos
    return res.status(401).json({ error: "Request expirado" });
  }

  // ── 3. Procesar el evento ────────────────────────────────────────────────
  const { type, data } = req.body;
  if (type !== "payment") return res.status(200).json({ received: true });

  try {
    // Verificar el pago directamente en MP
    const paymentRes = await fetch("https://api.mercadopago.com/v1/payments/" + data.id, {
      headers: { "Authorization": "Bearer " + process.env.MP_ACCESS_TOKEN },
    });

    if (!paymentRes.ok) {
      console.error("Error consultando pago MP:", paymentRes.status);
      return res.status(200).json({ received: true });
    }

    const payment = await paymentRes.json();

    // Solo procesar pagos aprobados
    if (payment.status !== "approved") {
      return res.status(200).json({ received: true });
    }

    // ── 4. Validar external_reference ────────────────────────────────────
    const extRef = payment.external_reference || "";
    const parts  = extRef.split("|");

    if (parts.length !== 2) {
      console.error("external_reference mal formado:", extRef);
      return res.status(200).json({ received: true });
    }

    const [userId, plan] = parts;

    if (!userId || !plan || userId.length < 10) {
      console.error("userId o plan invalido:", userId, plan);
      return res.status(200).json({ received: true });
    }

    // ── 5. Validar que el plan sea uno conocido ───────────────────────────
    const LIMITES = { emprendedor: 100, pro: 500 };
    const planKey = plan.toLowerCase();
    const limite  = LIMITES[planKey];

    if (!limite) {
      console.error("Plan desconocido:", planKey);
      return res.status(200).json({ received: true });
    }

    // ── 6. Verificar que el pago no fue ya procesado (idempotencia) ──────
    const checkRes = await fetch(
      process.env.VITE_SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId + "&select=plan,subscription_id",
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
        },
      }
    );

    if (checkRes.ok) {
      const profiles = await checkRes.json();
      const profile  = profiles[0];
      if (profile?.subscription_id === String(payment.id)) {
        console.log("Pago ya procesado:", payment.id);
        return res.status(200).json({ received: true });
      }
    }

    // ── 7. Actualizar el plan en Supabase ─────────────────────────────────
    const updateRes = await fetch(
      process.env.VITE_SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId,
      {
        method: "PATCH",
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          plan: planKey,
          generaciones_limite: limite,
          subscription_status: "active",
          payment_provider: "mercadopago",
          subscription_id: String(payment.id),
        }),
      }
    );

    if (!updateRes.ok) {
      console.error("Error actualizando Supabase:", await updateRes.text());
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    console.log("Plan actualizado correctamente:", userId, planKey);

  } catch (error) {
    console.error("Error webhook MP:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  return res.status(200).json({ received: true });
}
