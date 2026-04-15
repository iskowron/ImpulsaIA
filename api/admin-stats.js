// api/admin-stats.js
// C-01+A-01 HARDENED:
// - NO usa VITE_ADMIN_SECRET_TOKEN (estaba expuesto en el bundle cliente)
// - Verifica el JWT de Supabase server-side y comprueba role='admin' en la DB
// - El email de admin nunca sale del servidor

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Verificar que el request viene de un usuario con role='admin' en Supabase
async function verifyAdmin(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.latinalabs.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  // A-01: Verificar rol admin via JWT — nunca via token en el bundle cliente
  const isAdmin = await verifyAdmin(req.headers["authorization"]);
  if (!isAdmin) {
    // No revelar si el endpoint existe o no ante requests no autorizados
    return res.status(403).json({ error: "Acceso denegado." });
  }

  const VERCEL_API_TOKEN  = process.env.VERCEL_API_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn("[admin-stats] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no configurados");
    return res.status(200).json({ vercel: null });
  }

  try {
    const [deploymentsRes, analyticsRes] = await Promise.allSettled([
      fetch(`https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=5`, {
        headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      }),
      fetch(`https://api.vercel.com/v1/web-analytics/stats?projectId=${VERCEL_PROJECT_ID}&from=${Date.now() - 7 * 24 * 60 * 60 * 1000}&to=${Date.now()}&granularity=day`, {
        headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      }),
    ]);

    let deployments = null;
    let analytics   = null;

    if (deploymentsRes.status === "fulfilled" && deploymentsRes.value.ok) {
      const data = await deploymentsRes.value.json();
      deployments = (data.deployments || []).map(d => ({
        uid:       d.uid,
        name:      d.name,
        state:     d.state,
        createdAt: d.createdAt,
        url:       d.url,
      }));
    }

    if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
      analytics = await analyticsRes.value.json();
    }

    const lastDeploy = deployments?.[0];

    return res.status(200).json({
      vercel: {
        lastDeploy: lastDeploy ? {
          state:     lastDeploy.state,
          createdAt: lastDeploy.createdAt,
          url:       lastDeploy.url,
          isReady:   lastDeploy.state === "READY",
        } : null,
        deployments: deployments || [],
        analytics:   analytics   || null,
      },
    });

  } catch (err) {
    console.error("[admin-stats] Error:", err.message);
    return res.status(200).json({ vercel: null });
  }
}
