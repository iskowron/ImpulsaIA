import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

const RUBROS = [
  { id: "ropa", label: "Indumentaria", icon: "👗" },
  { id: "gastronomia", label: "Gastronomia", icon: "🍕" },
  { id: "belleza", label: "Belleza", icon: "💅" },
  { id: "salud", label: "Salud", icon: "🏃" },
  { id: "tecnologia", label: "Tecnologia", icon: "💻" },
  { id: "educacion", label: "Educacion", icon: "📚" },
  { id: "inmobiliaria", label: "Inmobiliaria", icon: "🏠" },
  { id: "veterinaria", label: "Veterinaria", icon: "🐾" },
  { id: "coaching", label: "Coaching", icon: "🎯" },
  { id: "otro", label: "Otro rubro", icon: "✦" },
];

const RUBRO_TONE = {
  ropa: "usa lenguaje trendy y referencias a moda y estilo",
  gastronomia: "usa lenguaje apetitoso y sensorial que invite a saborear",
  belleza: "usa lenguaje que transmita glamour y autocuidado",
  salud: "usa lenguaje motivador y empoderador orientado al bienestar",
  tecnologia: "usa lenguaje claro y moderno orientado a beneficios concretos",
  educacion: "usa lenguaje que inspire curiosidad y crecimiento personal",
  inmobiliaria: "usa lenguaje de confianza, solidez e inversion inteligente",
  veterinaria: "usa lenguaje calido y empatico que transmita amor por las mascotas",
  coaching: "usa lenguaje inspirador orientado a resultados y transformacion",
  otro: "usa lenguaje profesional, claro y persuasivo",
};

const CONTENT_TYPES = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬", prompt: (b, t, r, p) => "Redacta un mensaje de WhatsApp Business para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Maximo 80 palabras, directo, emojis moderados y CTA claro." + (p ? " Al final del mensaje incluir el numero de contacto: " + p + "." : "") + " Solo el mensaje." },
  { id: "instagram", label: "Instagram", icon: "📸", prompt: (b, t, r, p) => "Crea un post de Instagram para " + b + ". Tema: " + t + ". " + (RUBRO_TONE[r] || "") + ". Texto maximo 150 palabras, CTA poderoso y 10 hashtags." + (p ? " Incluir el numero de contacto " + p + " en el CTA." : "") + " Solo el contenido." },
  { id: "stories", label: "Stories", icon: "⭕", prompt: (b, t, r, p) => "Crea una secuencia de 5 stories de Instagram para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Cada story: texto maximo 15 palabras, sticker sugerido y CTA." + (p ? " En la ultima story incluir el numero " + p + " como contacto." : "") },
  { id: "email", label: "Email", icon: "📧", prompt: (b, t, r, p) => "Escribe un email de marketing para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Incluye: Asunto, Preencabezado, Saludo, Cuerpo maximo 200 palabras y CTA." + (p ? " Agregar el numero " + p + " como dato de contacto al final." : "") },
  { id: "ads", label: "Ads", icon: "🎯", prompt: (b, t, r, p) => "Crea un anuncio Facebook/Instagram Ads para " + b + ". Tema: " + t + ". " + (RUBRO_TONE[r] || "") + ". Titular 40 chars, Descripcion 125 chars, Texto 90 palabras y CTA boton." + (p ? " Incluir numero de contacto " + p + " en la descripcion." : "") },
  { id: "linkedin", label: "LinkedIn", icon: "💼", prompt: (b, t, r, p) => "Escribe un post de LinkedIn para " + b + " sobre: " + t + ". Gancho inicial, desarrollo con valor, CTA final. Maximo 200 palabras." + (p ? " Agregar numero de contacto " + p + " al final." : "") },
  { id: "landing", label: "Landing", icon: "🚀", prompt: (b, t, r, p) => "Crea el copy hero de una landing page para " + b + ". Oferta: " + t + ". " + (RUBRO_TONE[r] || "") + ". H1 8 palabras, H2 15 palabras, 3 beneficios con emoji y CTA boton." + (p ? " Incluir el numero " + p + " como CTA de contacto directo." : "") },
];

const PLANS = [
  { name: "Gratis", price: "0", color: "#64748b", desc: "Conoce la plataforma", features: ["10 generaciones/mes", "3 tipos de contenido", "Sin calendario"], limit: 10, popular: false, disabled: true },
  { name: "Emprendedor", price: "9", color: "#f59e0b", desc: "Para negocios que arrancan", features: ["100 generaciones/mes", "7 formatos + Stories", "Calendario 7 dias", "Contenido por rubro", "Analisis de calidad"], limit: 100, popular: false, disabled: false },
  { name: "Pro", price: "29", color: "#f97316", desc: "Para negocios en expansion", features: ["500 generaciones/mes", "Todo lo anterior", "Calendario 30 dias", "Soporte prioritario"], limit: 500, popular: true, disabled: false },
  { name: "Agencia", price: "79", color: "#a78bfa", desc: "Para agencias y equipos", features: ["Generaciones ilimitadas", "5 cuentas de usuario", "White label", "Manager dedicado"], limit: 99999, popular: false, disabled: false },
];

const TIPS = [
  { icon: "🔥", cat: "Constancia", text: "La consistencia supera a la perfeccion. Publicar todos los dias con contenido bueno vale mas que una pieza perfecta al mes." },
  { icon: "⏰", cat: "Timing", text: "El 80% del engagement ocurre en las primeras 2 horas. Publica cuando tu audiencia esta activa." },
  { icon: "📈", cat: "Crecimiento", text: "Los negocios que publican 5 o mas veces por semana crecen 3 veces mas rapido en redes sociales." },
  { icon: "💬", cat: "WhatsApp", text: "WhatsApp tiene 98% de tasa de apertura frente al 20% del email. Es el canal con mas impacto." },
  { icon: "⭕", cat: "Stories", text: "Las stories con preguntas generan 4 veces mas respuestas. Siempre incluye una interaccion." },
  { icon: "✍️", cat: "Copywriting", text: "El primer renglon de tu post decide si te leen o no. Dedicale el triple de tiempo." },
  { icon: "🎯", cat: "Nicho", text: "Hablarle a todos es hablarle a nadie. Cuanto mas especifico sea tu mensaje, mas convierte." },
  { icon: "📅", cat: "Planificacion", text: "Los negocios que planifican su contenido con anticipacion publican 4 veces mas." },
  { icon: "🤝", cat: "Confianza", text: "El 81% de los consumidores necesita confiar en una marca antes de comprar. El contenido construye esa confianza." },
  { icon: "🧠", cat: "Psicologia", text: "La gente no compra productos, compra la mejor version de si misma. Vende la transformacion." },
  { icon: "💰", cat: "Ventas", text: "El 70% de las decisiones de compra ocurren en redes sociales antes de llegar a la tienda." },
  { icon: "🔄", cat: "Reutilizar", text: "Un post se convierte en story, en reel, en email y en WhatsApp. Reutiliza siempre." },
  { icon: "🎬", cat: "Video", text: "Los videos cortos y reels tienen el doble de alcance organico que las imagenes estaticas." },
  { icon: "🌟", cat: "Autoridad", text: "Compartir errores y aprendizajes genera mas confianza que mostrar solo los exitos." },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(245,158,11,0.3);border-radius:4px}
  @keyframes ll-fade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ll-blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes ll-pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.05)}}
  @keyframes ll-float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(2deg)}}
  @keyframes ll-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes ll-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  .ll-gradient-text{background:linear-gradient(135deg,#f59e0b,#f97316,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .ll-glass{background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
  .ll-input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;color:#f8fafc;font-size:15px;outline:none;box-sizing:border-box;transition:all 0.2s;font-family:'Inter',sans-serif}
  .ll-input:focus{border-color:rgba(245,158,11,0.6);background:rgba(255,255,255,0.07);box-shadow:0 0 0 4px rgba(245,158,11,0.08)}
  .ll-input::placeholder{color:#334155}
  .ll-btn{width:100%;padding:14px;border:none;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;letter-spacing:0.01em;transition:all 0.2s;font-family:'Inter',sans-serif}
  .ll-btn:hover{transform:translateY(-1px)}
  .ll-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none}
  .ll-btn-primary{background:linear-gradient(135deg,#f59e0b,#f97316);color:#0a0a0f}
  .ll-btn-primary:hover{box-shadow:0 12px 40px rgba(245,158,11,0.4)}
  .ll-btn-ghost{background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1)}
  .ll-nav{background:none;border:none;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:500;font-family:'Inter',sans-serif;transition:all 0.15s;border-bottom:2px solid transparent;color:#475569}
  .ll-nav.active{color:#f59e0b;border-bottom-color:#f59e0b}
  .ll-nav:hover:not(.active){color:#94a3b8}
  .ll-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px}
  .ll-card-hover:hover{background:rgba(255,255,255,0.05);border-color:rgba(245,158,11,0.3);transform:translateY(-2px);transition:all 0.2s}
  .ll-type-btn{border-radius:12px;padding:12px 8px;cursor:pointer;text-align:center;transition:all 0.15s;font-family:'Inter',sans-serif;border:1.5px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}
  .ll-type-btn.active{border-color:rgba(245,158,11,0.5);background:rgba(245,158,11,0.08)}
  .ll-type-btn:hover:not(.active){border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.04)}
  .ll-rubro{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:500;font-family:'Inter',sans-serif;transition:all 0.15s;display:flex;align-items:center;gap:6px;color:#64748b}
  .ll-rubro.active{background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.4);color:#f59e0b}
  .ll-rubro:hover:not(.active){border-color:rgba(255,255,255,0.15);color:#94a3b8}

  /* ── MOBILE RESPONSIVE ── */
  .ll-grid-inputs{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .ll-grid-types{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
  .ll-grid-plans{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .ll-grid-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .ll-grid-kpi2{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .ll-grid-admin{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .ll-grid-banners{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .ll-grid-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .ll-auth-layout{display:flex}
  .ll-auth-panel{width:480px}
  .ll-header-right{display:flex;align-items:center;gap:10px}
  .ll-header-usage{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:6px 12px}
  .ll-username{display:block}
  .ll-hero-h1{font-size:40px}
  .ll-hero-p{font-size:16px}
  .ll-section-pad{padding:36px 24px}

  @media(max-width:768px){
    .ll-grid-inputs{grid-template-columns:1fr}
    .ll-grid-types{grid-template-columns:repeat(4,1fr);gap:5px}
    .ll-grid-plans{grid-template-columns:1fr 1fr;gap:10px}
    .ll-grid-kpi{grid-template-columns:1fr 1fr;gap:8px}
    .ll-grid-kpi2{grid-template-columns:1fr 1fr;gap:8px}
    .ll-grid-admin{grid-template-columns:1fr;gap:10px}
    .ll-grid-banners{grid-template-columns:1fr;gap:8px}
    .ll-grid-trust{grid-template-columns:1fr;gap:8px}
    .ll-auth-layout{flex-direction:column}
    .ll-auth-panel{display:none}
    .ll-header-right{gap:6px}
    .ll-header-usage{display:none}
    .ll-username{display:none}
    .ll-hero-h1{font-size:26px;letter-spacing:-0.03em}
    .ll-hero-p{font-size:14px}
    .ll-section-pad{padding:20px 16px}
    .ll-nav{padding:8px 9px;font-size:11px}
    .ll-input{font-size:14px;padding:12px 14px}
    .ll-type-btn{padding:10px 4px}
    .ll-type-btn div:first-child{font-size:18px}
    .ll-type-btn div:last-child{font-size:9px}
  }

  @media(max-width:480px){
    .ll-grid-plans{grid-template-columns:1fr}
    .ll-grid-types{grid-template-columns:repeat(4,1fr)}
    .ll-hero-h1{font-size:22px}
    .ll-nav{padding:6px 7px;font-size:10px}
  }
`;

function TypewriterText({ text, speed = 8 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) setDisplayed(text.slice(0, ++i));
      else { setDone(true); clearInterval(iv); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}{!done && <span style={{ opacity: 0.6, animation: "ll-blink 1s infinite" }}>|</span>}</span>;
}

function RotatingTip() {
  const [cur, setCur] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setVis(false);
      setTimeout(() => { setCur(p => (p + 1) % TIPS.length); setVis(true); }, 300);
    }, 7000);
    return () => clearInterval(iv);
  }, []);
  const tip = TIPS[cur];
  return (
    <div style={{ background: "rgba(245,158,11,0.04)", borderBottom: "1px solid rgba(245,158,11,0.08)", padding: "10px 28px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(-4px)", transition: "all 0.3s" }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.icon}</span>
        <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>{tip.cat}</span>
        <span style={{ width: 1, height: 12, background: "rgba(245,158,11,0.3)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{tip.text}</span>
      </div>
    </div>
  );
}

function QualityBadge({ score, nivel, engagement, cta, mejora }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const bg = score >= 80 ? "rgba(16,185,129,0.08)" : score >= 60 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  const border = score >= 80 ? "rgba(16,185,129,0.2)" : score >= 60 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)";
  return (
    <div style={{ background: bg, border: "1px solid " + border, borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: mejora ? 10 : 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2.5px solid " + color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color, flexShrink: 0 }}>{score}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 3 }}>Calidad: <span style={{ color }}>{nivel}</span></div>
          <div style={{ fontSize: 11, color: "#475569" }}>Engagement: {engagement} &nbsp;·&nbsp; CTA: {cta}</div>
        </div>
      </div>
      {mejora && (
        <div style={{ display: "flex", gap: 8, background: "rgba(245,158,11,0.06)", borderRadius: 8, padding: "8px 12px" }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{mejora}</span>
        </div>
      )}
    </div>
  );
}

function AuthScreen({ onAuth, onDemo }) {
  const [mode, setMode] = useState("landing"); // landing | login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Cuenta creada. Revisa tu email para confirmar e inicia sesion.");
        setMode("login");
      }
    } catch (e) {
      setError(e.message === "Invalid login credentials" ? "Email o contrasena incorrectos." : e.message === "User already registered" ? "Ya existe una cuenta con ese email." : e.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://latinalabs.app",
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError("Error con Google: " + e.message);
      setGoogleLoading(false);
    }
  };

  const AuthForm = () => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "32px 28px", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
      <button onClick={handleGoogle} disabled={googleLoading || loading}
        style={{ width: "100%", padding: "13px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#f1f5f9", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18, transition: "all 0.2s" }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
        onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
        {googleLoading ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#f8fafc", borderRadius: "50%", animation: "ll-spin 0.7s linear infinite" }} /> : (
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        )}
        {googleLoading ? "Conectando..." : "Continuar con Google"}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 11, color: "#334155", fontWeight: 500 }}>O con tu email</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>
      <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {["login","register"].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif", background: mode === m ? "linear-gradient(135deg,#f59e0b,#f97316)" : "transparent", color: mode === m ? "#0a0a0f" : "#475569", transition: "all 0.2s" }}>
            {m === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Email</label>
        <input className="ll-input" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="tu@email.com" type="email" />
      </div>
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Contrasena</label>
        <input className="ll-input" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="Minimo 6 caracteres" type="password" />
      </div>
      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#6ee7b7", marginBottom: 16 }}>✓ {success}</div>}
      <button className="ll-btn ll-btn-primary" onClick={handle} disabled={loading || !email || !password}>
        {loading ? "Procesando..." : mode === "login" ? "Entrar a LatinLabs →" : "Crear cuenta gratis →"}
      </button>
      <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#334155" }}>
        {mode === "login" ? "No tenes cuenta? " : "Ya tenes cuenta? "}
        <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 600 }}>
          {mode === "login" ? "Registrate gratis" : "Iniciar sesion"}
        </span>
      </div>
    </div>
  );

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  if (mode === "landing") return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Inter',sans-serif", color: "#e2e8f0" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(245,158,11,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -300, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)", pointerEvents: "none", animation: "ll-pulse 8s ease-in-out infinite" }} />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(5,5,8,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}>⚡</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.05em" }}><span style={{ color: "#f8fafc" }}>Latin</span><span className="ll-gradient-text">Labs</span></span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setMode("login")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "7px 18px", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>Iniciar sesion</button>
          <button onClick={() => setMode("register")} style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 9, padding: "7px 18px", cursor: "pointer", fontSize: 13, color: "#0a0a0f", fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>Crear cuenta gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 99, padding: "6px 16px", fontSize: 12, color: "#f59e0b", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 28 }}>
          ⚡ IA diseñada para Latinoamerica
        </div>
        <h1 style={{ fontSize: "clamp(32px,5vw,58px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20, color: "#f8fafc" }}>
          Acelera tu produccion de contenido<br />
          <span className="ll-gradient-text">en español con IA</span>
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 580, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Genera posts, WhatsApp, emails y mas en 10 segundos.<br />Con el tono exacto de tu rubro. En tu idioma.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onDemo}
            style={{ padding: "14px 32px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", color: "#0a0a0f", fontFamily: "'Inter',sans-serif", boxShadow: "0 12px 40px rgba(245,158,11,0.35)", transition: "all 0.2s" }}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={e => e.currentTarget.style.transform = "none"}>
            Probar ahora gratis — sin registro ⚡
          </button>
          <button onClick={() => setMode("register")}
            style={{ padding: "14px 28px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", color: "#94a3b8", fontFamily: "'Inter',sans-serif" }}>
            Crear cuenta →
          </button>
        </div>
        <div style={{ marginTop: 18, fontSize: 12, color: "#1e293b" }}>Sin tarjeta de credito · 10 generaciones gratis al registrarte</div>
      </section>

      {/* METRICAS */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {[
            { n: "+10.000", l: "textos generados" },
            { n: "8 seg", l: "por generacion" },
            { n: "7", l: "formatos listos" },
            { n: "10", l: "rubros disponibles" },
            { n: "100%", l: "en español real" },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}><span className="ll-gradient-text">{m.n}</span></div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Para quien es</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "#f8fafc" }}>El contenido que necesita tu negocio</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="ll-grid-admin">
          {[
            { icon: "🏪", role: "Emprendedor", pain: "No sabes que publicar hoy", solution: "Post listo para copiar y pegar en 10 segundos. Todos los dias.", color: "#f59e0b" },
            { icon: "📊", role: "Marketing", pain: "Horas escribiendo el mismo copy", solution: "7 formatos generados al instante con el tono exacto de tu marca.", color: "#f97316" },
            { icon: "💰", role: "Ventas", pain: "Mensajes que no generan respuesta", solution: "WhatsApp con 98% de apertura que convierte al instante.", color: "#a78bfa" },
          ].map((r, i) => (
            <div key={i} onClick={onDemo} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = r.color + "60"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(" + r.color + "15 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: 36, marginBottom: 16 }}>{r.icon}</div>
              <div style={{ fontSize: 11, color: r.color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{r.role}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 10, lineHeight: 1.4 }}>"{r.pain}"</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{r.solution}</div>
              <div style={{ marginTop: 16, fontSize: 12, color: r.color, fontWeight: 600 }}>Probalo gratis →</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 20, padding: "32px 36px", display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 4 }}><span className="ll-gradient-text">+40%</span></div>
            <div style={{ fontSize: 14, color: "#64748b" }}>de engagement promedio en el primer mes</div>
          </div>
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          <div style={{ flex: 2, minWidth: 200 }}>
            <div style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.7, fontStyle: "italic", marginBottom: 12 }}>
              "Con LatinLabs publico todos los dias sin estresarme. Mi engagement subio 40% en el primer mes y ahora mis clientes me preguntan como hago tanto contenido."
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a0a0f" }}>M</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Maria G.</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Tienda de ropa online · Buenos Aires</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ textAlign: "center", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.04em", color: "#f8fafc", marginBottom: 12 }}>Empezá hoy. Es gratis.</h2>
        <p style={{ fontSize: 16, color: "#475569", marginBottom: 32 }}>Sin tarjeta. Sin contratos. 10 generaciones gratis para que lo pruebes.</p>
        <button onClick={onDemo}
          style={{ padding: "16px 40px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: "pointer", color: "#0a0a0f", fontFamily: "'Inter',sans-serif", boxShadow: "0 16px 48px rgba(245,158,11,0.35)" }}>
          Probar sin registro ⚡
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 28px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
          <a href="https://www.instagram.com/latinalabs" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "#334155", fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            @latinalabs
          </a>
          <a href="https://vm.tiktok.com/ZS9LSn5dM9HQQ-zqXf3/" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "#334155", fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
            @latinalabs
          </a>
          <a href="mailto:hola@latinalabs.app" style={{ color: "#334155", fontSize: 12, textDecoration: "none" }}>hola@latinalabs.app</a>
        </div>
        <p style={{ fontSize: 11, color: "#1e293b" }}>LatinLabs · Powered by Claude AI</p>
      </footer>
    </div>
  );

  // ── LOGIN / REGISTER FORM ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "24px" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(245,158,11,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)", pointerEvents: "none", animation: "ll-pulse 6s ease-in-out infinite" }} />
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "ll-fade 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16, boxShadow: "0 0 40px rgba(245,158,11,0.4)" }}>⚡</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em", marginBottom: 6 }}>
            <span style={{ color: "#f8fafc" }}>Latin</span><span className="ll-gradient-text">Labs</span>
          </div>
          <div style={{ fontSize: 14, color: "#475569" }}>Crea contenido que vende, en tu idioma</div>
        </div>
        <AuthForm />
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span onClick={() => setMode("landing")} style={{ fontSize: 12, color: "#334155", cursor: "pointer" }}>← Volver al inicio</span>
        </div>
      </div>
    </div>
  );
}

export default function LatinLabs() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("generator");
  const [business, setBusiness] = useState("");
  const [topic, setTopic] = useState("");
  const [phone, setPhone] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [demoUsed, setDemoUsed] = useState(() => parseInt(localStorage.getItem("ll_demo_used") || "0"));
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [selectedRubro, setSelectedRubro] = useState("otro");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quality, setQuality] = useState(null);
  const [analyzingQuality, setAnalyzingQuality] = useState(false);
  const [history, setHistory] = useState([]);
  const [calDays, setCalDays] = useState(7);
  const [calResult, setCalResult] = useState("");
  const [calLoading, setCalLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [rubroSelected, setRubroSelected] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [vercelStats, setVercelStats] = useState(null);
  const [liveCount, setLiveCount] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user?.id || "").single()
      .then(({ data }) => {
        setProfile(data);
        if (data && !data.rubro_configurado) setRubroSelected(false);
        if (data && data.rubro_configurado) setSelectedRubro(data.rubro_configurado);
      });
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setResult(""); setHistory([]);
  };

  const loadAdmin = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const [profilesRes, vercelRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, plan, generaciones_usadas, generaciones_limite, subscription_status, payment_provider, created_at")
          .order("created_at", { ascending: false }),
        fetch("/api/admin-stats", {
          headers: { "x-admin-token": import.meta.env.VITE_ADMIN_SECRET_TOKEN || "" }
        }).then(r => r.json()).catch(() => ({ vercel: null })),
      ]);

      const { data: profiles, error } = profilesRes;
      if (error) throw error;

      if (profiles) {
        const total = profiles.length;
        const pagos = profiles.filter(p => p.plan && p.plan !== "free" && p.plan !== "gratis" && p.subscription_status === "active");
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const semana = new Date(hoy); semana.setDate(semana.getDate() - 7);
        const mes = new Date(hoy); mes.setDate(mes.getDate() - 30);
        const nuevosHoy = profiles.filter(p => p.created_at && new Date(p.created_at) >= hoy).length;
        const nuevosSemana = profiles.filter(p => p.created_at && new Date(p.created_at) >= semana).length;
        const nuevosMes = profiles.filter(p => p.created_at && new Date(p.created_at) >= mes).length;
        const totalGen = profiles.reduce((acc, p) => acc + (p.generaciones_usadas || 0), 0);
        const mrr = pagos.reduce((acc, p) => {
          if (p.plan === "emprendedor") return acc + 9;
          if (p.plan === "pro") return acc + 29;
          if (p.plan === "agencia") return acc + 79;
          return acc;
        }, 0);
        const porPlan = {
          gratis: profiles.filter(p => !p.plan || p.plan === "free" || p.plan === "gratis").length,
          emprendedor: profiles.filter(p => p.plan === "emprendedor").length,
          pro: profiles.filter(p => p.plan === "pro").length,
          agencia: profiles.filter(p => p.plan === "agencia").length,
        };
        const porRubro = {};
        profiles.forEach(p => {
          const r = (p.rubro_configurado || p.rubro || "otro");
          porRubro[r] = (porRubro[r] || 0) + 1;
        });
        const topRubros = Object.entries(porRubro).sort((a,b) => b[1]-a[1]).slice(0,5);
        const arr = profiles.map(p => ({ d: new Date(p.created_at || Date.now()).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}), n: 1 }));
        const byDay = {};
        arr.forEach(({d}) => { byDay[d] = (byDay[d]||0)+1; });
        const growthData = Object.entries(byDay).slice(-7).map(([d,n]) => ({d,n}));

        setAdminData({ total, pagos: pagos.length, nuevosHoy, nuevosSemana, nuevosMes, totalGen, mrr, porPlan, topRubros, growthData, recientes: profiles.slice(0, 20) });
        setVercelStats(vercelRes.vercel || null);
        setLastUpdated(new Date().toLocaleTimeString("es-AR", {hour:"2-digit",minute:"2-digit"}));
      } else {
        setAdminError("No se pudieron obtener los datos. Verificá los permisos de Supabase.");
      }
    } catch (e) {
      console.error("Admin error:", e);
      setAdminError("Error: " + (e.message || "No se pudo conectar con la base de datos."));
    }
    setAdminLoading(false);
  };

  const subscribeAdmin = () => {
    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadAdmin();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const callAPI = async (prompt, system) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || "";
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ system: system || "Sos un experto en marketing digital. Respondés directamente con el contenido solicitado, en el idioma del usuario, sin explicaciones previas ni comentarios adicionales.", prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error del servidor");
    return data.result || "";
  };

  const generate = async () => {
    if (!business.trim() || !topic.trim()) return;
    if (demoMode) {
      if (demoUsed >= 2) {
        setDemoMode(false);
        return;
      }
      const newCount = demoUsed + 1;
      setDemoUsed(newCount);
      localStorage.setItem("ll_demo_used", String(newCount));
    }
    if (!demoMode && profile && profile.generaciones_usadas >= profile.generaciones_limite) { setActiveTab("plans"); return; }
    setLoading(true); setResult(""); setQuality(null);
    try {
      const text = await callAPI(selectedType.prompt(business, topic, selectedRubro, phone || ""));
      setResult(text);
      if (demoMode && demoUsed >= 2) {
        setTimeout(() => setDemoMode(false), 3000);
      }
      setHistory(prev => [{ type: selectedType.label, icon: selectedType.icon, business, topic, result: text, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
      if (profile && !demoMode) {
        const newCount = (profile.generaciones_usadas || 0) + 1;
        await supabase.from("profiles").update({ generaciones_usadas: newCount }).eq("id", user?.id || "");
        setProfile(prev => ({ ...prev, generaciones_usadas: newCount }));
      }
      analyzeQuality(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  const analyzeQuality = async (text) => {
    setAnalyzingQuality(true);
    try {
      const raw = await callAPI("Analiza este contenido de marketing y devuelve SOLO un JSON sin markdown: {\"score\":85,\"nivel\":\"Alto\",\"engagement\":\"Alto\",\"cta\":\"Fuerte\",\"mejora\":\"sugerencia en maximo 10 palabras\"}. Contenido: " + text.slice(0, 300), "Analizador de marketing. Responde SOLO JSON valido sin texto adicional.");
      setQuality(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { }
    setAnalyzingQuality(false);
  };

  const generateCalendar = async () => {
    if (!business.trim() || !topic.trim()) return;
    setCalLoading(true); setCalResult("");
    try {
      const text = await callAPI("Crea un calendario de contenido de " + calDays + " dias para " + business + " con tema central: " + topic + ". " + (RUBRO_TONE[selectedRubro] || "") + ". Para cada dia: Dia X - Formato: [red social] - Tema: [tema especifico] - Idea: [descripcion 20 palabras max]. Solo el calendario.");
      setCalResult(text);
    } catch (e) { setCalResult("Error: " + e.message); }
    setCalLoading(false);
  };

  const copy = (text) => { navigator.clipboard.writeText(text || result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const saveRubro = async (rubro) => {
    setSelectedRubro(rubro);
    if (profile) {
      await supabase.from("profiles").update({ rubro_configurado: rubro }).eq("id", user?.id || "");
      setProfile(prev => ({ ...prev, rubro_configurado: rubro }));
    }
  };

  if (loadingAuth) return (
    <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px", boxShadow: "0 0 40px rgba(245,158,11,0.4)" }}>⚡</div>
        <div style={{ fontSize: 13, color: "#334155", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>Cargando</div>
      </div>
    </div>
  );

  if (!user && !demoMode) return <AuthScreen onAuth={setUser} onDemo={() => setDemoMode(true)} />;

  const genUsadas = profile?.generaciones_usadas || 0;
  const genLimite = profile?.generaciones_limite || 10;
  const genPct = Math.min((genUsadas / genLimite) * 100, 100);
  const atLimit = genUsadas >= genLimite;
  const rubroActual = RUBROS.find(r => r.id === selectedRubro);
  const isAdmin = user?.email === ADMIN_EMAIL;
  const tabs = [["generator","Generar"], ...(demoMode ? [] : [["calendar","Calendario"], ["history","Historial"], ["plans","Planes"]]), ...(isAdmin ? [["admin","⚡ Admin"]] : [])];

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: "#050508", color: "#e2e8f0" }}>
      <style>{GLOBAL_CSS}</style>



      {/* Header */}
      <header style={{ height: 60, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, background: "rgba(5,5,8,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}>⚡</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.05em" }}>
            <span style={{ color: "#f8fafc" }}>Latin</span><span className="ll-gradient-text">Labs</span>
          </span>
        </div>

        <nav style={{ display: "flex", gap: 0 }}>
          {tabs.map(([tab, label]) => (
            <button key={tab} className={"ll-nav" + (activeTab === tab ? " active" : "")}
              onClick={() => { setActiveTab(tab); if (tab === "admin") loadAdmin(); }}>
              {label}
            </button>
          ))}
        </nav>

        <div className="ll-header-right">
          <div className="ll-header-usage">
            <div style={{ width: 56, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: genPct + "%", background: genPct > 85 ? "#ef4444" : "linear-gradient(90deg,#f59e0b,#f97316)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{genUsadas}/{genLimite}</span>
          </div>
          <button onClick={() => document.getElementById("rubro-section")?.scrollIntoView({behavior:"smooth"})} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "5px 9px", cursor: "pointer", fontSize: 16 }} title="Cambiar rubro">{rubroActual?.icon || "✦"}</button>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)" }} />
          <span className="ll-username" style={{ fontSize: 12, color: "#334155", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email?.split("@")[0] || "Demo"}</span>
          <button onClick={logout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: "#475569", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>Salir</button>
        </div>
      </header>

      {/* Demo mode banner */}
      {demoMode && (
        <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(249,115,22,0.08))", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>Modo demo</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>— {2 - demoUsed} generacion{2 - demoUsed !== 1 ? "es" : ""} gratis restante{2 - demoUsed !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setDemoMode(false); }} style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0a0a0f", fontFamily: "'Inter',sans-serif" }}>
              Crear cuenta gratis →
            </button>
          </div>
        </div>
      )}
      <RotatingTip />

      {/* GENERATOR */}
      {activeTab === "generator" && (
        <div className="ll-section-pad" style={{ maxWidth: 900, margin: "0 auto", animation: "ll-fade 0.4s ease" }}>

          {/* Hero header */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Generador de contenido</div>
            <h1 className="ll-hero-h1" style={{ fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.1, marginBottom: 12 }}>
              <span style={{ color: "#f8fafc" }}>Tu negocio merece </span>
              <span className="ll-gradient-text">contenido de calidad</span>
            </h1>
            <p className="ll-hero-p" style={{ color: "#475569", maxWidth: 500, margin: "0 auto" }}>Genera posts, emails y mensajes listos para publicar en segundos, con el tono exacto de tu industria.</p>
          </div>

          {/* Welcome banner — solo si no eligio rubro aun */}
          {selectedRubro === "otro" && !profile?.rubro_configurado && (
            <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.05))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>✦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>Personaliza tu experiencia</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Selecciona tu industria abajo para que el contenido use el tono exacto de tu negocio.</div>
              </div>
            </div>
          )}

          {/* Rubro selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#334155", marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Tu industria</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {RUBROS.map(r => (
                <button key={r.id} className={"ll-rubro" + (selectedRubro === r.id ? " active" : "")} onClick={() => setSelectedRubro(r.id)}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main card */}
          <div className="ll-card" style={{ padding: "28px", marginBottom: 20 }}>
            {/* Inputs */}
            <div className="ll-grid-inputs" style={{ marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Nombre del negocio</label>
                <input className="ll-input" style={{ fontSize: 14 }} value={business} onChange={e => setBusiness(e.target.value)} placeholder="ej: Cafeteria El Sol, Studio Pilates..." />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tema o campana</label>
                <input className="ll-input" style={{ fontSize: 14 }} value={topic} onChange={e => setTopic(e.target.value)} placeholder="ej: Descuento 30%, nuevo producto..." />
              </div>
            </div>

            {/* Phone — opcional */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Telefono de contacto
                <span style={{ fontSize: 10, color: "#1e293b", fontWeight: 400, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>opcional — aparece en el contenido generado</span>
              </label>
              <input className="ll-input" style={{ fontSize: 14 }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="ej: +54 11 2345-6789" type="tel" />
            </div>

            {/* Content type */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Formato</label>
              <div className="ll-grid-types">
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.id} className={"ll-type-btn" + (selectedType.id === ct.id ? " active" : "")} onClick={() => setSelectedType(ct)}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{ct.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: selectedType.id === ct.id ? "#f59e0b" : "#475569", lineHeight: 1.2 }}>{ct.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {atLimit && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Alcanzaste el limite de generaciones de tu plan.</span>
                <span onClick={() => setActiveTab("plans")} style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Ver planes →</span>
              </div>
            )}

            <button className="ll-btn" onClick={generate} disabled={loading || !business || !topic || atLimit}
              style={{ background: loading || atLimit || !business || !topic ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#f59e0b,#f97316)", border: loading || atLimit || !business || !topic ? "1px solid rgba(255,255,255,0.07)" : "none", color: loading || atLimit || !business || !topic ? "#334155" : "#0a0a0f", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading || atLimit || !business || !topic ? "not-allowed" : "pointer", boxShadow: !loading && !atLimit && business && topic ? "0 8px 32px rgba(245,158,11,0.25)" : "none" }}>
              {loading ? "Generando con IA..." : "Generar " + selectedType.label + " ⚡"}
            </button>

            {result && (
              <div style={{ marginTop: 20, animation: "ll-fade 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{selectedType.icon}</span>
                    <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{selectedType.label} listo</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => copy(result)} style={{ background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)", border: "1px solid " + (copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"), borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: copied ? "#10b981" : "#64748b", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>{copied ? "✓ Copiado" : "Copiar"}</button>
                    <button onClick={generate} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: "#64748b", fontFamily: "'Inter',sans-serif" }}>Regenerar</button>
                    <button onClick={() => { setResult(""); setQuality(null); }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: "#64748b", fontFamily: "'Inter',sans-serif" }}>Limpiar</button>
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 22px", fontSize: 14, lineHeight: 1.9, color: "#94a3b8", whiteSpace: "pre-wrap", maxHeight: 340, overflowY: "auto" }}>
                  <TypewriterText text={result} />
                </div>
                {analyzingQuality && <div style={{ marginTop: 10, fontSize: 11, color: "#334155", textAlign: "center" }}>Analizando calidad del contenido...</div>}
                {quality && !analyzingQuality && <QualityBadge {...quality} />}
              </div>
            )}
          </div>

          {/* Feature banners */}
          <div className="ll-grid-banners">
            {[
              { icon: "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&q=80", title: "WhatsApp que vende", desc: "El formato con mas impacto directo del mercado", color: "#25D366" },
              { icon: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80", title: "Instagram que engancha", desc: "Posts y stories que hacen parar el scroll", color: "#E1306C" },
              { icon: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&q=80", title: "Emails que abren", desc: "Asunto + cuerpo + CTA listos para enviar", color: "#f59e0b" },
            ].map((b, i) => (
              <div key={i} className="ll-card ll-card-hover" style={{ overflow: "hidden", cursor: "pointer", borderRadius: 14 }} onClick={() => setSelectedType(CONTENT_TYPES[i])}>
                <div style={{ height: 100, backgroundImage: "url(" + b.icon + ")", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, rgba(5,5,8,0.8) 100%)" }} />
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CALENDAR */}
      {activeTab === "calendar" && (
        <div className="ll-section-pad" style={{ maxWidth: 900, margin: "0 auto", animation: "ll-fade 0.4s ease" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Planificacion</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.05em", color: "#f8fafc", marginBottom: 8 }}>Calendario de contenido</h1>
            <p style={{ fontSize: 15, color: "#475569" }}>La consistencia es la clave. Genera tu plan de publicaciones completo en un clic.</p>
          </div>

          {/* Background image card */}
          <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 20, position: "relative" }}>
            <div style={{ height: 140, backgroundImage: "url('https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=900&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.75)" }} />
              <div style={{ position: "relative", padding: "28px 32px", zIndex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.03em", marginBottom: 4 }}>Planifica con inteligencia</div>
                <div style={{ fontSize: 14, color: "#94a3b8" }}>Los negocios que planifican su contenido publican 4 veces mas y con mejor calidad.</div>
              </div>
            </div>
          </div>

          <div className="ll-card" style={{ padding: "28px", marginBottom: 14 }}>
            <div className="ll-grid-inputs" style={{ marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tu negocio</label>
                <input className="ll-input" style={{ fontSize: 14 }} value={business} onChange={e => setBusiness(e.target.value)} placeholder="ej: Gym, Tienda online..." />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tema central</label>
                <input className="ll-input" style={{ fontSize: 14 }} value={topic} onChange={e => setTopic(e.target.value)} placeholder="ej: Vuelta al cole, Verano 2025..." />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: "#334155", marginBottom: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Duracion</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setCalDays(d)}
                    style={{ padding: "10px 24px", borderRadius: 10, border: calDays === d ? "1.5px solid rgba(245,158,11,0.5)" : "1.5px solid rgba(255,255,255,0.08)", background: calDays === d ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)", color: calDays === d ? "#f59e0b" : "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            <button className="ll-btn" onClick={generateCalendar} disabled={calLoading || !business || !topic}
              style={{ background: calLoading || !business || !topic ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", color: calLoading || !business || !topic ? "#334155" : "#0a0a0f", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: calLoading || !business || !topic ? "not-allowed" : "pointer" }}>
              {calLoading ? "Generando calendario..." : "Generar calendario de " + calDays + " dias ⚡"}
            </button>

            {calResult && (
              <div style={{ marginTop: 20, animation: "ll-fade 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tu calendario</span>
                  <button onClick={() => copy(calResult)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: "#64748b", fontFamily: "'Inter',sans-serif" }}>Copiar todo</button>
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 22px", fontSize: 13, lineHeight: 2, color: "#94a3b8", whiteSpace: "pre-wrap", maxHeight: 480, overflowY: "auto" }}>
                  <TypewriterText text={calResult} speed={4} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {activeTab === "history" && (
        <div className="ll-section-pad" style={{ maxWidth: 820, margin: "0 auto", animation: "ll-fade 0.4s ease" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Registro</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.05em", color: "#f8fafc", marginBottom: 6 }}>Historial</h1>
            <p style={{ fontSize: 15, color: "#475569" }}>{history.length > 0 ? history.length + " contenidos generados en esta sesion" : "Tus generaciones aparecen aqui"}</p>
          </div>

          {history.length === 0 ? (
            <div className="ll-card" style={{ padding: "60px 32px", textAlign: "center", borderRadius: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Sin historial aun</div>
              <div style={{ fontSize: 14, color: "#1e293b", marginBottom: 20 }}>Genera tu primer contenido para verlo aqui</div>
              <button onClick={() => setActiveTab("generator")} style={{ padding: "10px 28px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 10, color: "#0a0a0f", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                Ir al generador →
              </button>
            </div>
          ) : history.map((h, i) => (
            <div key={i} className="ll-card ll-card-hover" style={{ padding: "18px 20px", marginBottom: 10, borderRadius: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{h.icon}</span>
                  <span style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{h.type}</span>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{h.business}</span>
                  <span style={{ fontSize: 12, color: "#334155" }}>· {h.topic}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#1e293b" }}>{h.date}</span>
                  <button onClick={() => copy(h.result)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: "#475569", fontFamily: "'Inter',sans-serif" }}>Copiar</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>{h.result.slice(0, 220)}...</div>
            </div>
          ))}
        </div>
      )}

      {/* PLANS */}
      {activeTab === "plans" && (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 24px", animation: "ll-fade 0.4s ease" }}>

          {/* Header with background */}
          <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 40, position: "relative" }}>
            <div style={{ height: 200, backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=980&q=80')", backgroundSize: "cover", backgroundPosition: "center top" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.8)" }} />
              <div style={{ position: "relative", zIndex: 1, padding: "40px 44px" }}>
                <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Precios</div>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.05em", color: "#f8fafc", marginBottom: 8 }}>Planes simples, resultados reales</div>
                <div style={{ fontSize: 15, color: "#64748b" }}>Sin contratos · Cancela cuando quieras · Paga con MercadoPago</div>
              </div>
            </div>
          </div>

          {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pago") === "ok" && (
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 14, color: "#6ee7b7", textAlign: "center" }}>
              ✓ Pago exitoso. Tu plan fue actualizado. Recarga la pagina para ver tus nuevas generaciones.
            </div>
          )}

          <div className="ll-grid-plans">
            {PLANS.map((p, i) => (
              <div key={i} style={{ background: p.popular ? "rgba(249,115,22,0.05)" : "rgba(255,255,255,0.03)", border: p.popular ? "1.5px solid rgba(249,115,22,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px 20px", position: "relative", display: "flex", flexDirection: "column" }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0a0a0f", fontSize: 9, fontWeight: 900, padding: "4px 14px", whiteSpace: "nowrap", letterSpacing: "0.12em", borderRadius: 99, textTransform: "uppercase" }}>MAS POPULAR</div>
                )}
                <div style={{ fontSize: 9, color: p.color, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>{p.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#475569" }}>USD </span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.04em" }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: "#475569" }}>/mes</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ flex: 1, marginBottom: 20 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, marginBottom: 9, fontSize: 13, color: "#64748b", alignItems: "flex-start", lineHeight: 1.4 }}>
                      <span style={{ color: p.color, flexShrink: 0, fontWeight: 800, fontSize: 14 }}>✓</span>{f}
                    </div>
                  ))}
                </div>

                {p.disabled ? (
                  <button disabled style={{ padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#1e293b", fontSize: 13, cursor: "not-allowed", fontFamily: "'Inter',sans-serif" }}>Plan actual</button>
                ) : p.name === "Agencia" ? (
                  <button onClick={() => window.open("mailto:hola@latinalabs.app?subject=Plan Agencia", "_blank")}
                    style={{ padding: "10px", background: "transparent", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 10, color: "#a78bfa", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                    Contactar ventas
                  </button>
                ) : (
                  <button onClick={async () => {
                    try {
                      const res = await fetch("/api/mp-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p.name.toLowerCase(), userId: user?.id || "", userEmail: user?.email || "" }) });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                      else alert("Error al iniciar el pago. Intenta nuevamente.");
                    } catch (e) { alert("Error de conexion. Intenta nuevamente."); }
                  }}
                    style={{ padding: "12px", background: p.popular ? "linear-gradient(135deg,#f59e0b,#f97316)" : "rgba(0,158,227,0.08)", border: p.popular ? "none" : "1px solid rgba(0,158,227,0.25)", borderRadius: 10, color: p.popular ? "#0a0a0f" : "#38bdf8", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: p.popular ? "0 8px 24px rgba(245,158,11,0.3)" : "none" }}>
                    {p.popular ? "Suscribirse ahora →" : "Suscribirse"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="ll-grid-trust" style={{ marginTop: 20 }}>
            {[
              ["🔐", "Pagos seguros", "Procesado por MercadoPago con encriptacion SSL"],
              ["📊", "Sin permanencia", "Cancelas en cualquier momento sin penalizacion"],
              ["💳", "Multiples metodos", "Tarjeta, debito, efectivo y mas opciones"],
            ].map(([icon, title, desc], i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>{title}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN */}
      {activeTab === "admin" && isAdmin && (
        <div className="ll-section-pad" style={{ maxWidth: 1040, margin: "0 auto", animation: "ll-fade 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Solo visible para vos</div>
              <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.05em", color: "#f8fafc", marginBottom: 4 }}>Panel de control</h1>
              <p style={{ fontSize: 13, color: "#475569" }}>
                {lastUpdated ? "Actualizado " + lastUpdated : "Listo para cargar"}
                {adminData && <span style={{ marginLeft: 8, fontSize: 11, background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>EN VIVO</span>}
              </p>
            </div>
            <button onClick={() => { setAdminData(null); setAdminError(null); loadAdmin(); }}
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "9px 18px", color: "#f59e0b", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
              Actualizar datos
            </button>
          </div>

          {adminLoading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(245,158,11,0.2)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "ll-spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 14, color: "#334155" }}>Cargando datos de Supabase...</div>
            </div>
          )}

          {adminError && !adminLoading && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "24px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: "#fca5a5", marginBottom: 10 }}>{adminError}</div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>Ejecuta en Supabase SQL Editor: alter table profiles disable row level security;</div>
              <button onClick={loadAdmin} style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 9, padding: "9px 22px", color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Reintentar</button>
            </div>
          )}

          {adminData && !adminLoading && (
            <>
              <div className="ll-grid-kpi" style={{ marginBottom: 12 }}>
                {[
                  { icon: "👥", label: "Usuarios totales", value: adminData.total, color: "#f59e0b", sub: "+" + adminData.nuevosHoy + " hoy" },
                  { icon: "💳", label: "Clientes pagos", value: adminData.pagos, color: "#10b981", sub: adminData.total > 0 ? Math.round((adminData.pagos/adminData.total)*100) + "% conversion" : "0%" },
                  { icon: "💰", label: "MRR", value: "USD " + adminData.mrr, color: "#a78bfa", sub: adminData.mrr > 0 ? "ARR: USD " + (adminData.mrr*12) : "Primer pago pendiente" },
                  { icon: "⚡", label: "Generaciones", value: adminData.totalGen.toLocaleString(), color: "#38bdf8", sub: adminData.total > 0 ? Math.round(adminData.totalGen/adminData.total) + " prom/usuario" : "-" },
                ].map((k,i) => (
                  <div key={i} className="ll-card" style={{ padding: "18px 16px", borderRadius: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontSize: 22 }}>{k.icon}</span>
                      <span style={{ fontSize: 10, color: "#334155", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 99 }}>{k.sub}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: k.color, letterSpacing: "-0.04em" }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div className="ll-grid-kpi2" style={{ marginBottom: 16 }}>
                {[
                  { label: "Nuevos hoy", value: adminData.nuevosHoy, color: "#f59e0b" },
                  { label: "Nuevos esta semana", value: adminData.nuevosSemana, color: "#f59e0b" },
                  { label: "Nuevos este mes", value: adminData.nuevosMes, color: "#f59e0b" },
                  { label: "Gen por cliente pago", value: adminData.pagos > 0 ? Math.round(adminData.totalGen/adminData.pagos) : 0, color: "#38bdf8" },
                ].map((k,i) => (
                  <div key={i} className="ll-card" style={{ padding: "14px 16px", borderRadius: 14 }}>
                    <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: k.color, letterSpacing: "-0.04em" }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {vercelStats ? (
                <div className="ll-card" style={{ padding: "20px", borderRadius: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Vercel Analytics - ultimos 7 dias</div>
                    <span style={{ fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>CONECTADO</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                    {[
                      { label: "Visitas", value: vercelStats.pageviews != null ? vercelStats.pageviews : "-", color: "#38bdf8" },
                      { label: "Visitantes unicos", value: vercelStats.visitors != null ? vercelStats.visitors : "-", color: "#a78bfa" },
                      { label: "Tasa de rebote", value: vercelStats.bounceRate != null ? Math.round(vercelStats.bounceRate) + "%" : "-", color: "#f59e0b" },
                      { label: "Duracion promedio", value: vercelStats.avgDuration != null ? Math.round(vercelStats.avgDuration/1000) + "s" : "-", color: "#10b981" },
                    ].map((v,i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: v.color, letterSpacing: "-0.03em" }}>{v.value}</div>
                        <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>{v.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ll-card" style={{ padding: "14px 20px", borderRadius: 14, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>Vercel Analytics no configurado aun</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>Agrega VERCEL_API_TOKEN y VERCEL_PROJECT_ID en las variables de entorno de Vercel</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#f59e0b", background: "rgba(245,158,11,0.08)", padding: "3px 10px", borderRadius: 99, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>PENDIENTE</span>
                </div>
              )}

              <div className="ll-grid-admin">
                <div className="ll-card" style={{ padding: "20px", borderRadius: 16 }}>
                  <div style={{ fontSize: 11, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Distribucion por plan</div>
                  {[
                    { plan: "Gratis", count: adminData.porPlan.gratis, color: "#64748b" },
                    { plan: "Emprendedor", count: adminData.porPlan.emprendedor, color: "#f59e0b" },
                    { plan: "Pro", count: adminData.porPlan.pro, color: "#f97316" },
                    { plan: "Agencia", count: adminData.porPlan.agencia, color: "#a78bfa" },
                  ].map((p,i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{p.plan}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.count} <span style={{ fontSize: 10, color: "#334155", fontWeight: 400 }}>({adminData.total > 0 ? Math.round((p.count/adminData.total)*100) : 0}%)</span></span>
                      </div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: adminData.total > 0 ? Math.round((p.count/adminData.total)*100) + "%" : "0%", background: p.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  ))}
                  {adminData.topRubros && adminData.topRubros.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 11, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>Top rubros</div>
                      {adminData.topRubros.map(([rubro, count], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", padding: "4px 0", borderBottom: i < adminData.topRubros.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span style={{ textTransform: "capitalize" }}>{rubro}</span>
                          <span style={{ color: "#f59e0b", fontWeight: 600 }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ll-card" style={{ padding: "20px", borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Ultimos registros</div>
                    <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                      En vivo
                    </span>
                  </div>
                  <div style={{ maxHeight: 420, overflowY: "auto" }}>
                    {adminData.recientes.map((u,i) => {
                      const pc = u.plan === "pro" ? "#f97316" : u.plan === "emprendedor" ? "#f59e0b" : u.plan === "agencia" ? "#a78bfa" : "#334155";
                      const pl = u.plan || "gratis";
                      const fecha = u.created_at ? new Date(u.created_at).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"}) : "-";
                      const isNew = u.created_at && (Date.now() - new Date(u.created_at).getTime()) < 24*60*60*1000;
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < adminData.recientes.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                              {(u.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                                {(u.email || "-").split("@")[0]}
                                {isNew && <span style={{ fontSize: 9, background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>NUEVO</span>}
                              </div>
                              <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{u.generaciones_usadas || 0} gen - {fecha}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: pc + "18", color: pc, fontWeight: 800, textTransform: "uppercase" }}>{pl}</span>
                            {u.payment_provider && <span style={{ fontSize: 9, color: "#334155" }}>{u.payment_provider}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 28px", textAlign: "center", marginTop: 60 }}>

        {/* Social + Email links */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>

          {/* Instagram */}
          <a href="https://www.instagram.com/latinalabs" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor="rgba(245,158,11,0.4)"; e.currentTarget.style.background="rgba(245,158,11,0.06)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>@latinalabs</span>
          </a>

          {/* TikTok */}
          <a href="https://vm.tiktok.com/ZS9LSn5dM9HQQ-zqXf3/" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor="rgba(245,158,11,0.4)"; e.currentTarget.style.background="rgba(245,158,11,0.06)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>@latinalabs</span>
          </a>

          {/* Divisor */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)" }} />

          {/* Email hola */}
          <a href="mailto:hola@latinalabs.app"
            style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor="rgba(245,158,11,0.4)"; e.currentTarget.style.background="rgba(245,158,11,0.06)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>hola@latinalabs.app</span>
          </a>

          {/* Email soporte */}
          <a href="mailto:soporte@latinalabs.app"
            style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor="rgba(245,158,11,0.4)"; e.currentTarget.style.background="rgba(245,158,11,0.06)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>soporte@latinalabs.app</span>
          </a>
        </div>

        <p style={{ fontSize: 11, color: "#1e293b" }}>LatinLabs · Powered by Claude AI</p>
      </footer>
    </div>
  );
}
