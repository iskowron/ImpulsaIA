// api/mp-checkout.js
// ⚠️  Este archivo DEBE estar en /api/mp-checkout.js en la RAIZ del repo
// ⚠️  NO dentro de /src/  — Vercel solo detecta funciones serverless en /api/

const BASE_URL = "https://www.latinalabs.app";

const PLANES = {
  emprendedor: { titulo: "LatinLabs Emprendedor", precio: 9.00 },
  pro:         { titulo: "LatinLabs Pro",         precio: 29.00 },
  agencia:     { titulo: "LatinLabs Agencia",     precio: 79.00 },
};

export default async function handler(req, res) {
  // CORS — necesario para que el frontend pueda llamar a esta función
  res.setHeader("Access-Control-Allow-Origin", BASE_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, userId, userEmail } = req.body;

  // Validaciones básicas
  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: "Datos incompletos: se requiere plan, userId y userEmail" });
  }

  const planKey = plan.toLowerCase().trim();
  const planData = PLANES[planKey];
  if (!planData) {
    return res.status(400).json({ error: `Plan invalido: '${plan}'. Planes disponibles: emprendedor, pro, agencia` });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    console.error("[mp-checkout] CRÍTICO: MP_ACCESS_TOKEN no configurado en variables de entorno de Vercel");
    return res.status(500).json({ error: "Error de configuracion del servidor" });
  }

  try {
    const body = {
      items: [{
        id: planKey,
        title: planData.titulo,
        quantity: 1,
        currency_id: "ARS",          // ⚠️  Cambiá a "USD" si los precios son en dólares
        unit_price: planData.precio, // MercadoPago requiere número (no string)
      }],
      payer: {
        email: userEmail,
      },
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

    console.log(`[mp-checkout] Creando preferencia para ${userEmail} - plan ${planKey}`);

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
      // Log completo para debugging en Vercel Functions logs
      console.error("[mp-checkout] Error de MercadoPago:", {
        status: response.status,
        message: preference?.message,
        cause: preference?.cause,
        error: preference?.error,
      });
      return res.status(502).json({
        error: "Error al procesar el pago",
        detail: preference?.message || "Respuesta inválida de MercadoPago",
      });
    }

    if (!preference.id || !preference.init_point) {
      console.error("[mp-checkout] Respuesta inesperada de MercadoPago (sin id/init_point):", JSON.stringify(preference).slice(0, 300));
      return res.status(502).json({ error: "Error al procesar el pago" });
    }

    console.log(`[mp-checkout] Preferencia creada OK. ID: ${preference.id}`);

    return res.status(200).json({
      url: preference.init_point,
      preferenceId: preference.id,
    });

  } catch (error) {
    console.error("[mp-checkout] Excepción no controlada:", error.message, error.stack);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
