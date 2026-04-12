export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  const body = await getRawBody(req);

  let event;
  try {
    event = verifyStripeSignature(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: "Webhook signature invalida: " + err.message });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan?.toLowerCase();

    const LIMITES = { emprendedor: 100, pro: 500 };
    const limite = LIMITES[plan] || 10;

    if (userId) {
      await updateSupabase(userId, plan, limite, session.subscription);
    }
  }

  return res.status(200).json({ received: true });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function verifyStripeSignature(payload, sig, secret) {
  const parts = sig.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.split("=")[1];
  const signatures = parts.filter(p => p.startsWith("v1=")).map(p => p.split("=")[1]);

  if (!timestamp || signatures.length === 0) throw new Error("Firma invalida");

  const signedPayload = timestamp + "." + payload;

  const crypto = require("crypto");
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  if (!signatures.includes(expected)) throw new Error("Firma no coincide");

  return JSON.parse(payload);
}

async function updateSupabase(userId, plan, limite, subscriptionId) {
  await fetch(process.env.VITE_SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId, {
    method: "PATCH",
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_KEY,
      "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      plan: plan,
      generaciones_limite: limite,
      subscription_id: subscriptionId,
      subscription_status: "active",
      payment_provider: "stripe",
    }),
  });
}
