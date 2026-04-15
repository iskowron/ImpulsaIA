// api/mp-checkout.js
// A-04 HARDENED: Errores internos ocultos en producción

const BASE_URL = "https://www.latinalabs.app";

const PLANES = {
  emprendedor: { titulo: "LatinLabs Emprendedor", precio: 9.00 },
  pro:         { titulo: "LatinLabs Pro",         precio: 29.00 },
  agencia:     { titulo: "LatinLabs Agencia",     precio: 79.00 },
};

const IS_PROD = process.env.VERCEL_ENV === "production";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", BASE_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const { plan, userId, userEmail } = req.body || {};

  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: "Datos incompletos. Recargá la página e intentá de nuevo." });
  }

  const planKey  = plan.toLowerCase().trim();
  const planData = PLANES[planKey];
  if (!planData) {
    return res.status(400).json({ error: "Plan no válido." });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    console.error("[mp-checkout] CRÍTICO: MP_ACCESS_TOKEN no configurado en Vercel");
    return res.status(500).json({ error: "Error de configuración del servidor. Contactá soporte." });
  }

  const tokenTipo = MP_ACCESS_TOKEN.startsWith("TEST-") ? "SANDBOX" : "PRODUCCIÓN";
  console.log(`[mp-checkout] Token: ${tokenTipo} | Plan: ${planKey} | Email: ${userEmail}`);

  const body = {
    items: [{
      id:          planKey,
      title:       planData.titulo,
      quantity:    1,
      currency_id: "ARS",
      unit_price:  planData.precio,
    }],
    payer: { email: userEmail },
    back_urls: {
      success: `${BASE_URL}/?pago=ok`,
      failure: `${BASE_URL}/?pago=cancelado`,
      pending: `${BASE_URL}/?pago=pendiente`,
    },
    auto_return:          "approved",
    external_reference:   `${userId}|${planKey}`,
    notification_url:     `${BASE_URL}/api/webhook-mp`,
    statement_descriptor: "LATINALABS",
  };

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization":  `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type":   "application/json",
      },
      body: JSON.stringify(body),
    });

    const preference = await response.json();

    if (!response.ok) {
      // A-04: En producción, loggear el detalle pero NO devolverlo al cliente
      console.error("[mp-checkout] Error MP:", {
        status:  response.status,
        message: preference?.message,
        error:   preference?.error,
        cause:   preference?.cause,
      });

      const clientMsg = IS_PROD
        ? "Error al procesar el pago. Si el problema persiste escribinos a soporte@latinalabs.app"
        : `MP ${response.status}: ${preference?.message || "sin mensaje"} | ${preference?.error || ""} | causa: ${JSON.stringify(preference?.cause)}`;

      return res.status(502).json({ error: clientMsg });
    }

    if (!preference.id || !preference.init_point) {
      console.error("[mp-checkout] Sin init_point:", JSON.stringify(preference).slice(0, 300));
      return res.status(502).json({ error: "Error al procesar el pago. Intentá de nuevo." });
    }

    console.log(`[mp-checkout] ✅ Preferencia creada: ${preference.id}`);
    return res.status(200).json({
      url:          preference.init_point,
      preferenceId: preference.id,
    });

  } catch (err) {
    console.error("[mp-checkout] Excepción:", err.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
