export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Webhook MP recibido:", JSON.stringify(req.body).slice(0, 200));

  try {
    const { type, data } = req.body || {};

    if (type !== "payment" || !data?.id) {
      console.log("Webhook MP: evento ignorado, tipo:", type);
      return res.status(200).json({ received: true });
    }

    const paymentId = data.id;
    console.log("Webhook MP: consultando pago:", paymentId);

    // Consultar el pago en MP
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

    // Validar external_reference
    const extRef = String(payment.external_reference || "");
    const pipeIdx = extRef.indexOf("|");

    if (pipeIdx === -1) {
      console.error("Webhook MP: external_reference sin pipe:", extRef);
      return res.status(200).json({ received: true });
    }

    const userId = extRef.slice(0, pipeIdx);
    const plan   = extRef.slice(pipeIdx + 1).toLowerCase().trim();

    console.log("Webhook MP: userId:", userId, "plan:", plan);

    const LIMITES = { emprendedor: 100, pro: 500 };
    const limite  = LIMITES[plan];

    if (!limite) {
      console.error("Webhook MP: plan desconocido:", plan);
      return res.status(200).json({ received: true });
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Webhook MP: variables de Supabase no configuradas");
      return res.status(200).json({ received: true });
    }

    // Actualizar Supabase
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
          plan: plan,
          generaciones_limite: limite,
          subscription_status: "active",
          payment_provider: "mercadopago",
          subscription_id: String(paymentId),
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("Webhook MP: error Supabase:", updateRes.status, errText);
      return res.status(200).json({ received: true });
    }

    console.log("Webhook MP: plan actualizado OK:", userId, plan, limite);
    return res.status(200).json({ received: true });

  } catch (err) {
    console.error("Webhook MP: excepcion:", err.message);
    return res.status(200).json({ received: true });
  }
}
