const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.latinalabs.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("subscribe: Supabase no configurado");
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const email = (body?.email || "").trim().toLowerCase();
    const source = (body?.source || "home").trim().slice(0, 50);

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 200) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // Verificar si ya existe (idempotencia)
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&select=id`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.length > 0) {
        return res.status(200).json({ ok: true, already: true });
      }
    }

    // Insertar nuevo subscriber
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers`,
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          email,
          source,
          created_at: new Date().toISOString(),
        }),
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("subscribe: error insertando:", insertRes.status, errText.slice(0, 200));
      return res.status(500).json({ error: "Error al guardar el email" });
    }

    return res.status(200).json({ ok: true, already: false });

  } catch (err) {
    console.error("subscribe: excepción:", err.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
