// api/admin-stats.js
// ⚠️  Este archivo DEBE estar en /api/admin-stats.js en la RAIZ del repo
// Retorna estadísticas de Vercel para el panel de admin

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Verificar token de admin
  const ADMIN_TOKEN = process.env.VITE_ADMIN_SECRET_TOKEN || process.env.ADMIN_SECRET_TOKEN;
  const incomingToken = req.headers["x-admin-token"];

  if (ADMIN_TOKEN && incomingToken !== ADMIN_TOKEN) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

  // Si no están configuradas las vars de Vercel, devolver null sin error
  // (el frontend ya maneja este caso mostrando "Pendiente")
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn("[admin-stats] VERCEL_API_TOKEN o VERCEL_PROJECT_ID no configurados");
    return res.status(200).json({ vercel: null });
  }

  try {
    // Obtener deployments recientes
    const [deploymentsRes, analyticsRes] = await Promise.allSettled([
      fetch(`https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=5`, {
        headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      }),
      fetch(`https://api.vercel.com/v1/web-analytics/stats?projectId=${VERCEL_PROJECT_ID}&from=${Date.now() - 7 * 24 * 60 * 60 * 1000}&to=${Date.now()}&granularity=day`, {
        headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      }),
    ]);

    let deployments = null;
    let analytics = null;

    if (deploymentsRes.status === "fulfilled" && deploymentsRes.value.ok) {
      const data = await deploymentsRes.value.json();
      deployments = (data.deployments || []).map(d => ({
        uid: d.uid,
        name: d.name,
        state: d.state,
        createdAt: d.createdAt,
        url: d.url,
        meta: d.meta,
      }));
    }

    if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
      analytics = await analyticsRes.value.json();
    }

    const lastDeploy = deployments?.[0];

    return res.status(200).json({
      vercel: {
        lastDeploy: lastDeploy
          ? {
              state: lastDeploy.state,
              createdAt: lastDeploy.createdAt,
              url: lastDeploy.url,
              isReady: lastDeploy.state === "READY",
            }
          : null,
        deployments: deployments || [],
        analytics: analytics || null,
      },
    });
  } catch (error) {
    console.error("[admin-stats] Error:", error.message);
    // No fallar — devolver null para que el frontend lo maneje graciosamente
    return res.status(200).json({ vercel: null });
  }
}
