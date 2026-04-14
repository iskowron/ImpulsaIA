// api/mp-checkout.js
// ⚠️  Este archivo DEBE estar en /api/mp-checkout.js en la RAIZ del repo

const BASE_URL = "https://www.latinalabs.app";

const PLANES = {
  emprendedor: { titulo: "LatinLabs Emprendedor", precio: 9.00 },
  pro:         { titulo: "LatinLabs Pro",         precio: 29.00 },
  agencia:     { titulo: "LatinLabs Agencia",     precio: 79.00 },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", BASE_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, userId, userEmail } = req.body;

  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: `Datos incompletos — plan:${plan} userId:${userId} userEmail:${userEmail}` });
  }

  const planKey = plan.toLowerCase().trim();
  const planData = PLANES[planKey];
  if (!planData) {
    return res.status(400).json({ error: `Plan invalido: "${plan}". Disponibles: emprendedor, pro, agencia` });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    console.error("[mp-checkout] CRITICO: MP_ACCESS_TOKEN no configurado en Vercel");
    return res.status(500).json({ error: "MP_ACCESS_TOKEN no configurado en Vercel → Settings → Environment Variables" });
  }

  const tokenTipo = MP_ACCESS_TOKEN.startsWith("TEST-") ? "SANDBOX/TEST" : "PRODUCCION";
  console.log(`[mp-checkout] Token: ${tokenTipo} | Plan: ${planKey} | Email: ${userEmail}`);

  const body = {
    items: [{
      id: planKey,
      title: planData.titulo,
      quantity: 1,
      currency_id: "ARS",
      unit_price: planData.precio,
    }],
    payer: { email: userEmail },
    back_urls: {
      success: `${BASE_URL}/?pago=ok`,
      failure: `${BASE_URL}/?pago=cancelado`,
      pending: `${BASE_URL}/?pago=pendiente`,
    },
    auto_return: "approved",
    external_reference: `${userId}|${planKey}`,
    notification_url: `${BASE_URL}/api/webhook-mp`,
    statement_descriptor: "LATINALABS",
  };

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const preference = await response.json();

    if (!response.ok) {
      const mpMessage = preference?.message  || "sin mensaje";
      const mpError   = preference?.error    || "sin campo error";
      const mpCause   = preference?.cause    ? JSON.stringify(preference.cause) : "sin causa";

      console.error("[mp-checkout] Error MP:", {
        httpStatus: response.status,
        message:    mpMessage,
        error:      mpError,
        cause:      mpCause,
      });

      return res.status(502).json({
        error: `MP ${response.status}: ${mpMessage} | ${mpError} | causa: ${mpCause}`,
      });
    }

    if (!preference.id || !preference.init_point) {
      console.error("[mp-checkout] Sin id/init_point:", JSON.stringify(preference).slice(0, 400));
      return res.status(502).json({
        error: `MP respondio OK pero sin init_point: ${JSON.stringify(preference).slice(0, 200)}`,
      });
    }

    console.log(`[mp-checkout] OK - Preferencia creada: ${preference.id}`);
    return res.status(200).json({
      url: preference.init_point,
      preferenceId: preference.id,
    });

  } catch (err) {
    console.error("[mp-checkout] Excepcion:", err.message);
    return res.status(500).json({ error: `Excepcion servidor: ${err.message}` });
  }
}
