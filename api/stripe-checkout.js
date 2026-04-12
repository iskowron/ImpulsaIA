export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, userId, userEmail } = req.body;

  const PRICES = {
    emprendedor: process.env.STRIPE_PRICE_EMPRENDEDOR,
    pro: process.env.STRIPE_PRICE_PRO,
  };

  const priceId = PRICES[plan?.toLowerCase()];
  if (!priceId) return res.status(400).json({ error: "Plan invalido" });

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[0]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "mode": "subscription",
        "success_url": process.env.NEXT_PUBLIC_URL + "/planes?pago=ok",
        "cancel_url": process.env.NEXT_PUBLIC_URL + "/planes?pago=cancelado",
        "customer_email": userEmail,
        "metadata[userId]": userId,
        "metadata[plan]": plan,
      }),
    });

    const session = await response.json();
    if (!response.ok) throw new Error(session.error?.message || "Error de Stripe");

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
