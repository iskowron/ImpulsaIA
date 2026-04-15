// api/audit-log.js
// M-04 HARDENED: Registro de auditoría para acciones sensibles
// Loggea: logins, cambios de plan, accesos al admin, errores de autenticación

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Acciones permitidas para evitar log injection
const ALLOWED_ACTIONS = new Set([
  "login",
  "logout",
  "register",
  "plan_upgrade",
  "plan_payment_started",
  "plan_payment_completed",
  "plan_payment_failed",
  "admin_access",
  "generate_content",
  "password_change",
  "auth_error",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { action, metadata } = req.body || {};

  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ error: "Acción no permitida" });
  }

  // Obtener usuario del JWT si está presente
  let userId = null;
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    userId = user?.id || null;
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const userAgent = (req.headers["user-agent"] || "").slice(0, 200); // limitar longitud

  try {
    await supabaseAdmin.from("audit_logs").insert({
      user_id:    userId,
      action,
      ip_address: ip,
      user_agent: userAgent,
      metadata:   metadata ? JSON.stringify(metadata).slice(0, 1000) : null,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({ logged: true });
  } catch (err) {
    // No fallar si el log no se puede escribir — el audit log no debe bloquear el flujo
    console.error("[audit-log] Error escribiendo log:", err.message);
    return res.status(200).json({ logged: false });
  }
}
