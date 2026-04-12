export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, data } = req.body;

  if (type !== "payment") return res.status(200).json({ received: true });

  try {
    const paymentRes = await fetch("https://api.mercadopago.com/v1/payments/" + data.id, {
      headers: { "Authorization": "Bearer " + process.env.MP_ACCESS_TOKEN },
    });

    const payment = await paymentRes.json();

    if (payment.status === "approved") {
      const [userId, plan] = (payment.external_reference || "").split("|");

      const LIMITES = { emprendedor: 100, pro: 500 };
      const limite = LIMITES[plan?.toLowerCase()] || 10;

      if (userId && plan) {
        await fetch(process.env.VITE_SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId, {
          method: "PATCH",
          headers: {
            "apikey": process.env.SUPABASE_SERVICE_KEY,
            "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            plan: plan.toLowerCase(),
            generaciones_limite: limite,
            subscription_status: "active",
            payment_provider: "mercadopago",
          }),
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ received: true });
}
