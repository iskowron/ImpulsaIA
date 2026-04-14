export default async function handler(req, res) {
  // ── CORS restringido ──────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "https://www.latinalabs.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Error interno del servidor" });

  // ── Autenticacion — verificar JWT de Supabase ─────────────────────────────
  const authHeader = req.headers["authorization"] || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!jwt) return res.status(401).json({ error: "No autorizado" });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  // Verificar el usuario en Supabase con el JWT
  let userId = null;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": process.env.VITE_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${jwt}`,
      },
    });

    if (!userRes.ok) return res.status(401).json({ error: "Sesion invalida" });

    const userData = await userRes.json();
    userId = userData?.id;
    if (!userId) return res.status(401).json({ error: "Usuario no encontrado" });

  } catch {
    return res.status(401).json({ error: "Error de autenticacion" });
  }

  // ── Verificar limite de generaciones en el servidor ───────────────────────
  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=generaciones_usadas,generaciones_limite`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (profileRes.ok) {
      const profiles = await profileRes.json();
      const profile = profiles[0];
      if (profile && profile.generaciones_usadas >= profile.generaciones_limite) {
        return res.status(429).json({ error: "Limite de generaciones alcanzado" });
      }
    }
  } catch {
    // Si no podemos verificar el limite, continuamos — el frontend ya lo controla
  }

  // ── Validar body ──────────────────────────────────────────────────────────
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body) body = {};

  const { prompt, system } = body;
  if (!prompt || typeof prompt !== "string" || prompt.length > 4000) {
    return res.status(400).json({ error: "Prompt invalido" });
  }

  // ── Llamar a Anthropic ────────────────────────────────────────────────────
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: system || "Sos un experto en marketing digital para negocios latinoamericanos.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", response.status);
      return res.status(500).json({ error: "Error al generar contenido" });
    }

    const text = data.content?.map(b => b.text || "").join("") || "";
    return res.status(200).json({ result: text });

  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
