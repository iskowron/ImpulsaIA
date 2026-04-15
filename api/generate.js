// api/generate.js
// Hardened: rate limiting por IP + verificación JWT Supabase + límites por plan

import { createClient } from "@supabase/supabase-js";

// ── Rate limiter en memoria (por instancia serverless)
// Efectivo contra ataques simples. Para producción a escala usar Upstash Redis.
const ipHits = new Map();
const RATE_WINDOW_MS  = 60_000; // ventana de 1 minuto
const RATE_LIMIT_FREE = 10;     // requests/min para demo/no auth
const RATE_LIMIT_AUTH = 30;     // requests/min para usuarios autenticados

function checkRateLimit(ip, isAuth) {
  const now = Date.now();
  const limit = isAuth ? RATE_LIMIT_AUTH : RATE_LIMIT_FREE;
  const entry = ipHits.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }

  entry.count++;
  ipHits.set(ip, entry);

  // Limpiar entradas viejas cada ~100 calls para evitar memory leak
  if (ipHits.size > 1000) {
    for (const [key, val] of ipHits) {
      if (now > val.resetAt) ipHits.delete(key);
    }
  }

  return entry.count <= limit;
}

// ── Cliente Supabase (admin) para verificar tokens y límites
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role — NUNCA exponer al cliente
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Extraer IP real (Vercel pone el header x-forwarded-for)
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
           || req.socket?.remoteAddress
           || "unknown";

  const isDemoMode = req.headers["x-demo-mode"] === "true";
  const authHeader  = req.headers["authorization"] || "";
  const jwtToken    = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // ── Rate limiting diferenciado por tipo de usuario
  const allowed = checkRateLimit(ip, !!jwtToken);
  if (!allowed) {
    console.warn(`[generate] Rate limit hit — IP: ${ip} | demo: ${isDemoMode}`);
    return res.status(429).json({
      error: "Demasiadas solicitudes. Esperá un minuto antes de intentar de nuevo.",
    });
  }

  // ── Validar body
  const { prompt, system } = req.body || {};
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "El campo prompt es requerido." });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: "El prompt supera el límite de caracteres." });
  }

  // ── Verificar usuario autenticado y límite de generaciones
  let userId = null;
  if (!isDemoMode && jwtToken) {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwtToken);
    if (authError || !user) {
      return res.status(401).json({ error: "Token de sesión inválido. Iniciá sesión de nuevo." });
    }
    userId = user.id;

    // Verificar límite de generaciones del plan
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("generaciones_usadas, generaciones_limite, plan, subscription_status")
      .eq("id", userId)
      .single();

    if (profile) {
      const usadas  = profile.generaciones_usadas  || 0;
      const limite  = profile.generaciones_limite   || 10;
      if (usadas >= limite) {
        return res.status(403).json({
          error: "Límite de generaciones alcanzado. Actualizá tu plan para continuar.",
          limitReached: true,
        });
      }
    }
  } else if (!isDemoMode && !jwtToken) {
    // Ni demo ni autenticado → rechazar
    return res.status(401).json({ error: "Autenticación requerida." });
  }

  // ── Llamar a Anthropic Claude
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    console.error("[generate] ANTHROPIC_API_KEY no configurada");
    return res.status(500).json({ error: "Error de configuración del servidor." });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":            "application/json",
        "x-api-key":               ANTHROPIC_KEY,
        "anthropic-version":       "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001", // Haiku: más rápido y económico para generaciones
        max_tokens: 1024,
        system:     system || "Sos un experto en marketing digital. Respondés directamente con el contenido solicitado, en el idioma del usuario, sin explicaciones previas ni comentarios adicionales.",
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      console.error("[generate] Anthropic error:", anthropicRes.status, err?.error?.message);
      return res.status(502).json({ error: "Error al generar el contenido. Intentá de nuevo." });
    }

    const anthropicData = await anthropicRes.json();
    const result = anthropicData?.content?.[0]?.text || "";

    if (!result) {
      return res.status(502).json({ error: "La IA no devolvió contenido. Intentá de nuevo." });
    }

    // ── Actualizar contador de generaciones (solo usuarios auth, no demo)
    if (userId) {
      await supabaseAdmin.rpc("increment_generaciones", { user_id: userId })
        .catch(e => console.warn("[generate] No se pudo incrementar contador:", e.message));
    }

    return res.status(200).json({ result });

  } catch (err) {
    console.error("[generate] Excepción:", err.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
