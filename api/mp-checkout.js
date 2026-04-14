const BASE_URL = "https://www.latinalabs.app";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, userId, userEmail } = req.body;

  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const PLANES = {
    emprendedor: { titulo: "LatinLabs Emprendedor", precio: 9 },
    pro:         { titulo: "LatinLabs Pro",         precio: 29 },
    agencia:     { titulo: "LatinLabs Agencia",     precio: 79 },
  };

  const planData = PLANES[plan.toLowerCase().trim()];
  if (!planData) return res.status(400).json({ error: "Plan invalido" });

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    console.error("mp-checkout: MP_ACCESS_TOKEN no configurado");
    return res.status(500).json({ error: "Error de configuracion del servidor" });
  }

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + MP_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{
          id: plan.toLowerCase(),
          title: planData.titulo,
          quantity: 1,
          currency_id: "ARS",
          unit_price: planData.precio,
        }],
        payer: { email: userEmail },
        back_urls: {
          success: BASE_URL + "/?pago=ok",
          failure: BASE_URL + "/?pago=cancelado",
          pending: BASE_URL + "/?pago=pendiente",
        },
        auto_return: "approved",
        external_reference: userId + "|" + plan.toLowerCase(),
        notification_url: BASE_URL + "/api/webhook-mp",
        statement_descriptor: "LATINALABS",
      }),
    });

    const preference = await response.json();

    if (!response.ok) {
      console.error("mp-checkout MP error:", response.status, preference?.message);
      return res.status(500).json({ error: "Error al procesar el pago" });
    }

    if (!preference.init_point) {
      console.error("mp-checkout: no init_point en respuesta:", JSON.stringify(preference).slice(0, 200));
      return res.status(500).json({ error: "Error al procesar el pago" });
    }

    return res.status(200).json({ url: preference.init_point });

  } catch (error) {
    console.error("mp-checkout excepcion:", error.message);
    return res.status(500).json({ error: "Error al procesar el pago" });
  }
}
