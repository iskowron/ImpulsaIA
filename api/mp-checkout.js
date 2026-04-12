export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, userId, userEmail } = req.body;

  const PLANES = {
    emprendedor: { titulo: "LatinLabs Emprendedor", precio: 9, limite: 100 },
    pro: { titulo: "LatinLabs Pro", precio: 29, limite: 500 },
  };

  const planData = PLANES[plan?.toLowerCase()];
  if (!planData) return res.status(400).json({ error: "Plan invalido" });

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.MP_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{
          title: planData.titulo,
          quantity: 1,
          currency_id: "USD",
          unit_price: planData.precio,
        }],
        payer: { email: userEmail },
        back_urls: {
          success: process.env.NEXT_PUBLIC_URL + "/planes?pago=ok",
          failure: process.env.NEXT_PUBLIC_URL + "/planes?pago=cancelado",
          pending: process.env.NEXT_PUBLIC_URL + "/planes?pago=pendiente",
        },
        auto_return: "approved",
        external_reference: userId + "|" + plan,
        notification_url: process.env.NEXT_PUBLIC_URL + "/api/webhook-mp",
      }),
    });

    const preference = await response.json();
    if (!response.ok) throw new Error(preference.message || "Error de MercadoPago");

    return res.status(200).json({ url: preference.init_point });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
