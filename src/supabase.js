import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error("Supabase env vars no configuradas: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // A-03: sessionStorage en vez de localStorage
    // Los tokens se borran al cerrar el tab → atacante con XSS no puede
    // robar sesiones de tabs cerradas. Tradeoff: el usuario se loguea de nuevo
    // al abrir una nueva pestaña. Aceptable para una app con datos de pago.
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Previene que el token de OAuth quede expuesto en la URL del browser
    flowType: "pkce",
  },
  global: {
    headers: {
      // Identifica el cliente en los logs de Supabase para auditoría
      "x-client-info": "latinalabs-web/1.0",
    },
  },
  // Realtime: solo activar canales cuando sea necesario (admin panel)
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
});
