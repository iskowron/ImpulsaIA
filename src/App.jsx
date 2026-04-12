import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

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
  { id: "whatsapp", label: "WhatsApp", icon: "💬", prompt: (b, t, r) => "Redacta un mensaje de WhatsApp Business para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Maximo 80 palabras, directo, emojis moderados y CTA claro. Solo el mensaje, sin explicaciones." },
  { id: "instagram", label: "Post Instagram", icon: "📸", prompt: (b, t, r) => "Crea un post de Instagram para " + b + ". Tema: " + t + ". " + (RUBRO_TONE[r] || "") + ". Texto maximo 150 palabras, CTA poderoso y 10 hashtags relevantes. Solo el contenido." },
  { id: "stories", label: "Stories", icon: "⭕", prompt: (b, t, r) => "Crea una secuencia de 5 stories de Instagram para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Cada story: texto maximo 15 palabras, sticker sugerido y CTA. Formato: Story 1: [texto] | Sticker: [tipo] | CTA: [accion]" },
  { id: "email", label: "Email", icon: "📧", prompt: (b, t, r) => "Escribe un email de marketing para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Incluye: Asunto, Preencabezado, Saludo, Cuerpo maximo 200 palabras y CTA claro." },
  { id: "ads", label: "Ads", icon: "🎯", prompt: (b, t, r) => "Crea un anuncio Facebook/Instagram Ads para " + b + ". Tema: " + t + ". " + (RUBRO_TONE[r] || "") + ". Titular maximo 40 caracteres, Descripcion maximo 125 caracteres, Texto principal maximo 90 palabras y CTA boton." },
  { id: "linkedin", label: "LinkedIn", icon: "💼", prompt: (b, t, r) => "Escribe un post de LinkedIn para " + b + " sobre: " + t + ". Tono experto y profesional. Gancho inicial impactante, desarrollo con valor real, CTA final. Maximo 200 palabras." },
  { id: "landing", label: "Landing", icon: "🚀", prompt: (b, t, r) => "Crea el copy hero de una landing page para " + b + ". Oferta: " + t + ". " + (RUBRO_TONE[r] || "") + ". H1 maximo 8 palabras, H2 maximo 15 palabras, 3 beneficios clave con emoji y CTA boton." },
];

const PLANS = [
  { name: "Gratis", price: "0", color: "#6b7280", desc: "Para conocer la plataforma", features: ["10 generaciones/mes", "3 tipos de contenido", "Sin calendario"], cta: "Plan actual", limit: 10, popular: false, disabled: true },
  { name: "Emprendedor", price: "9", color: "#f59e0b", desc: "Para negocios que arrancan", features: ["100 generaciones/mes", "Todos los formatos + Stories", "Calendario 7 dias", "Contenido por rubro", "Analisis de calidad"], cta: "Empezar ahora", limit: 100, popular: false, disabled: false },
  { name: "Pro", price: "29", color: "#f97316", desc: "Para negocios en expansion", features: ["500 generaciones/mes", "Todo lo anterior", "Calendario 30 dias", "Soporte prioritario"], cta: "Elegir Pro", limit: 500, popular: true, disabled: false },
  { name: "Agencia", price: "79", color: "#a78bfa", desc: "Para agencias y equipos", features: ["Generaciones ilimitadas", "5 cuentas de usuario", "White label", "Manager dedicado"], cta: "Hablar con ventas", limit: 99999, popular: false, disabled: false },
];

const TIPS = [
  { icon: "🔥", cat: "Constancia", text: "La consistencia supera a la perfeccion. Publicar todos los dias con contenido bueno vale mas que una pieza perfecta al mes." },
  { icon: "⏰", cat: "Timing", text: "El 80% del engagement ocurre en las primeras 2 horas de publicado. Publica cuando tu audiencia esta activa." },
  { icon: "📈", cat: "Crecimiento", text: "Los negocios que publican 5 o mas veces por semana crecen 3 veces mas rapido en redes sociales." },
  { icon: "💬", cat: "WhatsApp", text: "WhatsApp tiene 98% de tasa de apertura frente al 20% del email. Es el canal con mas impacto directo." },
  { icon: "⭕", cat: "Stories", text: "Las stories con preguntas generan 4 veces mas respuestas. Siempre incluye alguna interaccion." },
  { icon: "✍️", cat: "Copywriting", text: "El primer renglon de tu post decide si te leen o no. Dedicale el triple de tiempo que al resto." },
  { icon: "🎯", cat: "Nicho", text: "Hablarle a todos es hablarle a nadie. Cuanto mas especifico sea tu mensaje, mas convierte." },
  { icon: "📅", cat: "Planificacion", text: "Los negocios que planifican su contenido con anticipacion publican 4 veces mas y con mejor calidad." },
  { icon: "🤝", cat: "Confianza", text: "El 81% de los consumidores necesita confiar en una marca antes de comprar. El contenido construye esa confianza." },
  { icon: "📸", cat: "Visual", text: "Las publicaciones con imagenes reales del negocio generan 3 veces mas engagement que las imagenes genericas." },
  { icon: "🧠", cat: "Psicologia", text: "La gente no compra productos, compra la mejor version de si misma. Vende la transformacion." },
  { icon: "💡", cat: "Ideas", text: "Si no sabes que publicar, preguntale a tus clientes que dudas tienen. Cada pregunta es un post." },
  { icon: "🚀", cat: "Lanzamiento", text: "Para lanzar algo nuevo, empieza a generar expectativa 7 dias antes. El hype se construye, no aparece solo." },
  { icon: "📊", cat: "Metricas", text: "Mide lo que importa: cuantas consultas genera tu contenido, no solo cuantos likes recibes." },
  { icon: "💰", cat: "Ventas", text: "El 70% de las decisiones de compra ocurren en redes sociales antes de llegar a la tienda o web." },
  { icon: "🔄", cat: "Reutilizar", text: "Un buen contenido puede reutilizarse: un post se convierte en story, en reel, en email y en WhatsApp." },
  { icon: "❤️", cat: "Comunidad", text: "Responder comentarios en la primera hora de publicado aumenta el alcance organico hasta un 40%." },
  { icon: "🎬", cat: "Video", text: "Los videos cortos y reels tienen el doble de alcance organico que las imagenes estaticas." },
  { icon: "🌟", cat: "Autoridad", text: "Compartir errores y aprendizajes genera mas confianza que mostrar solo los exitos." },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────

function TypewriterText({ text, speed = 10 }) {
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
  return <span>{displayed}{!done && <span style={{ opacity: 0.5, animation: "ll-blink 1s infinite" }}>|</span>}</span>;
}

function RotatingTip() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setCurrent(p => (p + 1) % TIPS.length); setVisible(true); }, 350);
    }, 7000);
    return () => clearInterval(iv);
  }, []);
  const tip = TIPS[current];
  return (
    <div style={{ background: "rgba(245,158,11,0.03)", borderBottom: "1px solid rgba(245,158,11,0.08)", padding: "9px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(-4px)", transition: "all 0.35s ease" }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{tip.icon}</span>
        <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0, marginRight: 4 }}>{tip.cat}</span>
        <span style={{ fontSize: 11, color: "#525870", lineHeight: 1.4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{tip.text}</span>
        <div style={{ display: "flex", gap: 3, marginLeft: "auto", flexShrink: 0 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true); }, 200); }}
              style={{ width: current % 5 === i ? 14 : 4, height: 4, borderRadius: 99, background: current % 5 === i ? "#f59e0b" : "rgba(255,255,255,0.08)", cursor: "pointer", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QualityBadge({ score, nivel, engagement, cta, mejora }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const bg = score >= 80 ? "rgba(16,185,129,0.06)" : score >= 60 ? "rgba(245,158,11,0.06)" : "rgba(239,68,68,0.06)";
  return (
    <div style={{ background: bg, border: "1px solid " + color + "22", borderRadius: 10, padding: "12px 14px", marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid " + color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{score}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>Calidad del contenido: <span style={{ color }}>{nivel}</span></div>
          <div style={{ fontSize: 10, color: "#525870", marginTop: 1 }}>Engagement potencial: {engagement} &nbsp;·&nbsp; CTA: {cta}</div>
        </div>
      </div>
      {mejora && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: "rgba(245,158,11,0.06)", borderRadius: 7, padding: "7px 10px" }}>
          <span style={{ fontSize: 11, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>Sugerencia: {mejora}</span>
        </div>
      )}
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

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

  const STATS = [
    { n: "8 seg", l: "Tiempo promedio\nde generacion" },
    { n: "7", l: "Formatos de\ncontenido" },
    { n: "10+", l: "Rubros con\ntonos propios" },
    { n: "100%", l: "En tu\nidioma" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060609", display: "flex", fontFamily: "sans-serif" }}>
      <style>{`
        @keyframes ll-blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes ll-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ll-orb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.05)}}
        .ll-input{width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#f0ece0;font-size:13px;outline:none;box-sizing:border-box;transition:border-color 0.2s,background 0.2s;font-family:sans-serif}
        .ll-input:focus{border-color:rgba(245,158,11,0.5);background:rgba(255,255,255,0.06)}
        .ll-input::placeholder{color:#374151}
        .ll-btn-primary{width:100%;padding:12px;background:linear-gradient(135deg,#f59e0b,#f97316);border:none;border-radius:10px;color:#060609;font-weight:700;font-size:13px;cursor:pointer;letter-spacing:0.02em;transition:opacity 0.2s,transform 0.15s;font-family:sans-serif}
        .ll-btn-primary:hover{opacity:0.9;transform:translateY(-1px)}
        .ll-btn-primary:disabled{opacity:0.35;cursor:not-allowed;transform:none}
        .ll-rubro-btn{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:11px 10px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;font-family:sans-serif}
        .ll-rubro-btn:hover{background:rgba(245,158,11,0.06);border-color:rgba(245,158,11,0.3)}
        .ll-tab-btn{flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;font-family:sans-serif}
        .ll-nav-btn{background:none;border:none;padding:6px 14px;cursor:pointer;font-size:12px;font-family:sans-serif;transition:all 0.15s;border-bottom:2px solid transparent}
        .ll-ghost{background:transparent;border:1px solid rgba(255,255,255,0.08);color:#94a3b8;cursor:pointer;border-radius:8px;padding:5px 12px;font-size:11px;font-family:sans-serif;transition:all 0.15s}
        .ll-ghost:hover{border-color:rgba(245,158,11,0.4);color:#f0ece0}
        .ll-card{background:#0d0d15;border:1px solid rgba(255,255,255,0.06);border-radius:14px}
        .ll-field-input{width:100%;padding:10px 13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:9px;color:#f0ece0;font-size:12px;outline:none;box-sizing:border-box;transition:border-color 0.2s;font-family:sans-serif}
        .ll-field-input:focus{border-color:rgba(245,158,11,0.4)}
        .ll-field-input::placeholder{color:#2d3748}
      `}</style>

      {/* Left — Form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", animation: "ll-fade 0.5s ease" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16, boxShadow: "0 0 40px rgba(245,158,11,0.25)" }}>⚡</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#f0ece0", letterSpacing: "-0.04em" }}>
              Latin<span style={{ color: "#f59e0b" }}>Labs</span>
            </div>
            <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>Crea contenido que vende, en tu idioma</div>
          </div>

          {/* Card */}
          <div style={{ background: "#0d0d15", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "28px 24px", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 3, marginBottom: 22 }}>
              {["login","register"].map(m => (
                <button key={m} className="ll-tab-btn" onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{ background: mode === m ? "linear-gradient(135deg,#f59e0b,#f97316)" : "transparent", color: mode === m ? "#060609" : "#4b5563" }}>
                  {m === "login" ? "Iniciar sesion" : "Crear cuenta"}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Email</label>
              <input className="ll-input" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="tu@email.com" type="email" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, color: "#374151", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Contrasena</label>
              <input className="ll-input" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="Minimo 6 caracteres" type="password" />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#f87171", marginBottom: 14, display: "flex", gap: 7, alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>⚠</span> {error}
              </div>
            )}
            {success && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#6ee7b7", marginBottom: 14, display: "flex", gap: 7, alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>✓</span> {success}
              </div>
            )}

            <button className="ll-btn-primary" onClick={handle} disabled={loading || !email || !password}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar a LatinLabs" : "Crear cuenta gratis"}
            </button>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#1f2937" }}>
              {mode === "login" ? "No tenes cuenta? " : "Ya tenes cuenta? "}
              <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 600 }}>
                {mode === "login" ? "Registrate gratis" : "Iniciar sesion"}
              </span>
            </div>
          </div>

          {/* Tip card */}
          <div style={{ marginTop: 16, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 10, padding: "11px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
            <div>
              <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>{tip.cat}</div>
              <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }}>{tip.text}</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: "#1a1a2e" }}>Sin tarjeta de credito · 10 generaciones gratis al registrarte</div>
        </div>
      </div>

      {/* Right — Brand panel */}
      <div style={{ width: 380, background: "#0a0a10", borderLeft: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 36px", position: "relative", overflow: "hidden" }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: 60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", animation: "ll-orb 8s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 80, left: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)", animation: "ll-orb 10s ease-in-out infinite reverse", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>Por que LatinLabs</div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 12px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", letterSpacing: "-0.03em" }}>{s.n}</div>
                <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.5, marginTop: 2, whiteSpace: "pre-line" }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 24 }} />

          {/* Feature list */}
          {[
            ["💬", "WhatsApp con mas impacto", "El canal con mayor tasa de apertura del mercado"],
            ["🎯", "Contenido por rubro", "Tono y lenguaje adaptado a tu industria especifica"],
            ["📅", "Calendario completo", "Plan de contenido de 7 o 30 dias con un clic"],
            ["⭐", "Analisis de calidad", "Sabe si tu copy va a convertir antes de publicar"],
          ].map(([icon, title, desc], i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, color: "#2d3748", lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function LatinLabs() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("generator");
  const [business, setBusiness] = useState("");
  const [topic, setTopic] = useState("");
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
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        setProfile(data);
        if (data && !data.rubro_configurado) setShowOnboarding(true);
        if (data && data.rubro_configurado) setSelectedRubro(data.rubro_configurado);
      });
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setResult(""); setHistory([]);
  };

  const callAPI = async (prompt, system) => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: system || "Sos un experto en marketing digital con amplia experiencia. Respondés directamente con el contenido solicitado, en el idioma del usuario, sin explicaciones previas.", prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error del servidor");
    return data.result || "";
  };

  const generate = async () => {
    if (!business.trim() || !topic.trim()) return;
    if (profile && profile.generaciones_usadas >= profile.generaciones_limite) { setActiveTab("plans"); return; }
    setLoading(true); setResult(""); setQuality(null);
    try {
      const text = await callAPI(selectedType.prompt(business, topic, selectedRubro));
      setResult(text);
      setHistory(prev => [{ type: selectedType.label, icon: selectedType.icon, business, topic, result: text, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
      if (profile) {
        const newCount = (profile.generaciones_usadas || 0) + 1;
        await supabase.from("profiles").update({ generaciones_usadas: newCount }).eq("id", user.id);
        setProfile(prev => ({ ...prev, generaciones_usadas: newCount }));
      }
      analyzeQuality(text);
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  const analyzeQuality = async (text) => {
    setAnalyzingQuality(true);
    try {
      const prompt = "Analiza este contenido de marketing y devuelve SOLO un JSON sin markdown: {\"score\":85,\"nivel\":\"Alto\",\"engagement\":\"Alto\",\"cta\":\"Fuerte\",\"mejora\":\"sugerencia concreta en maximo 10 palabras\"}. Contenido: " + text.slice(0, 300);
      const raw = await callAPI(prompt, "Analizador de marketing. Responde SOLO JSON valido sin texto adicional.");
      setQuality(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { }
    setAnalyzingQuality(false);
  };

  const generateCalendar = async () => {
    if (!business.trim() || !topic.trim()) return;
    setCalLoading(true); setCalResult("");
    try {
      const text = await callAPI("Crea un calendario de contenido de " + calDays + " dias para " + business + " con tema central: " + topic + ". " + (RUBRO_TONE[selectedRubro] || "") + ". Para cada dia: Dia X - Formato: [red social] - Tema: [tema especifico] - Idea: [descripcion maximo 20 palabras]. Solo el calendario, sin introduccion.");
      setCalResult(text);
    } catch (e) { setCalResult("Error: " + e.message); }
    setCalLoading(false);
  };

  const copy = (text) => { navigator.clipboard.writeText(text || result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const saveRubro = async (rubro) => {
    setSelectedRubro(rubro);
    setShowOnboarding(false);
    if (profile) {
      await supabase.from("profiles").update({ rubro_configurado: rubro }).eq("id", user.id);
      setProfile(prev => ({ ...prev, rubro_configurado: rubro }));
    }
  };

  if (loadingAuth) return (
    <div style={{ minHeight: "100vh", background: "#060609", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
        <div style={{ fontSize: 12, color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cargando</div>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;

  const genUsadas = profile?.generaciones_usadas || 0;
  const genLimite = profile?.generaciones_limite || 10;
  const genPct = Math.min((genUsadas / genLimite) * 100, 100);
  const atLimit = genUsadas >= genLimite;
  const rubroActual = RUBROS.find(r => r.id === selectedRubro);
  const userName = user.email.split("@")[0];

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#060609", color: "#e2e8f0" }}>

      {/* Onboarding modal */}
      {showOnboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "ll-fade 0.3s ease" }}>
          <div style={{ background: "#0d0d15", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px", maxWidth: 460, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👋</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f0ece0", marginBottom: 6 }}>Bienvenido a LatinLabs</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>Contanos a que se dedica tu negocio para personalizar el tono y estilo del contenido.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {RUBROS.map(r => (
                <button key={r.id} className="ll-rubro-btn" onClick={() => saveRubro(r.id)}>
                  <span style={{ fontSize: 17 }}>{r.icon}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{r.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowOnboarding(false)} style={{ width: "100%", marginTop: 14, background: "none", border: "none", color: "#2d3748", fontSize: 11, cursor: "pointer", padding: "8px 0" }}>
              Configurar mas tarde
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ height: 56, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, background: "rgba(6,6,9,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 0 16px rgba(245,158,11,0.3)" }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.04em", color: "#f0ece0" }}>Latin<span style={{ color: "#f59e0b" }}>Labs</span></span>
        </div>

        <nav style={{ display: "flex", gap: 2 }}>
          {[["generator","Generar"], ["calendar","Calendario"], ["history","Historial"], ["plans","Planes"]].map(([tab, label]) => (
            <button key={tab} className="ll-nav-btn" onClick={() => setActiveTab(tab)}
              style={{ color: activeTab === tab ? "#f59e0b" : "#374151", borderBottomColor: activeTab === tab ? "#f59e0b" : "transparent", fontWeight: activeTab === tab ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Usage indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 10px" }}>
            <div style={{ width: 48, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: genPct + "%", background: genPct > 85 ? "#ef4444" : "linear-gradient(90deg,#f59e0b,#f97316)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 10, color: "#374151", fontWeight: 500 }}>{genUsadas}/{genLimite}</span>
          </div>

          <button onClick={() => setShowOnboarding(true)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontSize: 14 }} title="Cambiar rubro">
            {rubroActual?.icon || "✦"}
          </button>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.07)" }} />

          <span style={{ fontSize: 11, color: "#2d3748", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</span>
          <button className="ll-ghost" onClick={logout}>Salir</button>
        </div>
      </header>

      <RotatingTip />

      {/* ── GENERATOR ── */}
      {activeTab === "generator" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px", animation: "ll-fade 0.3s ease" }}>

          {/* Page header */}
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0ece0", marginBottom: 4 }}>
              Hola, {userName} 👋
            </h1>
            <p style={{ fontSize: 13, color: "#374151" }}>Que tipo de contenido necesitas crear hoy?</p>
          </div>

          {/* Rubro selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: "#2d3748", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Tu rubro</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {RUBROS.map(r => (
                <button key={r.id} onClick={() => setSelectedRubro(r.id)}
                  style={{ background: selectedRubro === r.id ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)", border: selectedRubro === r.id ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 11, color: selectedRubro === r.id ? "#f59e0b" : "#374151", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", fontFamily: "sans-serif" }}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main generator card */}
          <div className="ll-card" style={{ padding: "22px", marginBottom: 16 }}>

            {/* Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, color: "#2d3748", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Nombre de tu negocio</label>
                <input className="ll-field-input" value={business} onChange={e => setBusiness(e.target.value)} placeholder="ej: Tienda Mia, Studio Flores..." />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: "#2d3748", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Tema o campana</label>
                <input className="ll-field-input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="ej: Descuento 30%, nuevo producto..." />
              </div>
            </div>

            {/* Content type selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 10, color: "#2d3748", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Formato de contenido</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setSelectedType(ct)}
                    style={{ background: selectedType.id === ct.id ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)", border: selectedType.id === ct.id ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "10px 6px", cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontFamily: "sans-serif" }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{ct.icon}</div>
                    <div style={{ fontSize: 9, color: selectedType.id === ct.id ? "#f59e0b" : "#374151", fontWeight: 600, lineHeight: 1.2 }}>{ct.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Limit warning */}
            {atLimit && (
              <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: "#f87171", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Alcanzaste el limite de generaciones de tu plan.</span>
                <span onClick={() => setActiveTab("plans")} style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>Ver planes →</span>
              </div>
            )}

            {/* Generate button */}
            <button onClick={generate} disabled={loading || !business || !topic || atLimit}
              style={{ width: "100%", padding: "12px", background: loading || atLimit || !business || !topic ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#f59e0b,#f97316)", border: loading || atLimit || !business || !topic ? "1px solid rgba(255,255,255,0.06)" : "none", borderRadius: 10, color: loading || atLimit || !business || !topic ? "#374151" : "#060609", fontWeight: 700, fontSize: 13, cursor: loading || atLimit || !business || !topic ? "not-allowed" : "pointer", transition: "all 0.2s", letterSpacing: "0.02em", fontFamily: "sans-serif" }}>
              {loading ? "Generando con IA..." : "Generar " + selectedType.label + (rubroActual && selectedRubro !== "otro" ? " para " + rubroActual.label : "")}
            </button>

            {/* Result */}
            {result && (
              <div style={{ marginTop: 18, animation: "ll-fade 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{selectedType.icon}</span>
                    <span style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{selectedType.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="ll-ghost" onClick={() => copy(result)} style={{ fontSize: 11, padding: "4px 12px", color: copied ? "#10b981" : undefined, borderColor: copied ? "rgba(16,185,129,0.3)" : undefined }}>
                      {copied ? "✓ Copiado" : "Copiar"}
                    </button>
                    <button className="ll-ghost" onClick={generate} style={{ fontSize: 11, padding: "4px 12px" }}>Regenerar</button>
                    <button className="ll-ghost" onClick={() => { setResult(""); setQuality(null); }} style={{ fontSize: 11, padding: "4px 12px" }}>Limpiar</button>
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", fontSize: 13, lineHeight: 1.85, color: "#94a3b8", whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto" }}>
                  <TypewriterText text={result} />
                </div>
                {analyzingQuality && (
                  <div style={{ marginTop: 8, fontSize: 10, color: "#2d3748", textAlign: "center", letterSpacing: "0.05em" }}>Analizando calidad del contenido...</div>
                )}
                {quality && !analyzingQuality && <QualityBadge {...quality} />}
              </div>
            )}
          </div>

          {/* Mini feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              ["💬", "WhatsApp primero", "98% de tasa de apertura"],
              ["⭕", "Stories que convierten", "4x mas respuestas con preguntas"],
              ["📅", "Publicar consistente", "5+ veces/semana = 3x crecimiento"],
            ].map(([icon, title, desc], i) => (
              <div key={i} className="ll-card" style={{ padding: "14px", borderRadius: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1", marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 10, color: "#1f2937", lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {activeTab === "calendar" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px", animation: "ll-fade 0.3s ease" }}>
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0ece0", marginBottom: 4 }}>Calendario de contenido</h1>
            <p style={{ fontSize: 13, color: "#374151" }}>Genera un plan completo de publicaciones. La consistencia es la clave.</p>
          </div>

          <div className="ll-card" style={{ padding: "22px", marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, color: "#2d3748", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Tu negocio</label>
                <input className="ll-field-input" value={business} onChange={e => setBusiness(e.target.value)} placeholder="ej: Cafeteria, Tienda online..." />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: "#2d3748", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Tema central</label>
                <input className="ll-field-input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="ej: Temporada de verano..." />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 10, color: "#2d3748", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Duracion</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setCalDays(d)}
                    style={{ padding: "8px 20px", borderRadius: 8, border: calDays === d ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.06)", background: calDays === d ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)", color: calDays === d ? "#f59e0b" : "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generateCalendar} disabled={calLoading || !business || !topic}
              style={{ width: "100%", padding: "12px", background: calLoading || !business || !topic ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 10, color: calLoading || !business || !topic ? "#374151" : "#060609", fontWeight: 700, fontSize: 13, cursor: calLoading || !business || !topic ? "not-allowed" : "pointer", fontFamily: "sans-serif" }}>
              {calLoading ? "Generando calendario..." : "Generar calendario de " + calDays + " dias"}
            </button>

            {calResult && (
              <div style={{ marginTop: 18, animation: "ll-fade 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Tu calendario listo</span>
                  <button className="ll-ghost" onClick={() => copy(calResult)} style={{ fontSize: 11, padding: "4px 12px" }}>Copiar todo</button>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", fontSize: 12, lineHeight: 1.9, color: "#94a3b8", whiteSpace: "pre-wrap", maxHeight: 440, overflowY: "auto" }}>
                  <TypewriterText text={calResult} speed={5} />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "#2d3748", lineHeight: 1.7 }}>
            <span style={{ color: "#f59e0b", fontWeight: 600 }}>Consejo: </span>
            Los negocios que planifican su contenido con anticipacion generan 3x mas engagement. No necesitas ser perfecto, necesitas ser consistente.
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === "history" && (
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 20px", animation: "ll-fade 0.3s ease" }}>
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0ece0", marginBottom: 4 }}>Historial</h1>
            <p style={{ fontSize: 13, color: "#374151" }}>{history.length > 0 ? history.length + " generaciones en esta sesion" : "Tus generaciones aparecen aqui"}</p>
          </div>
          {history.length === 0 ? (
            <div className="ll-card" style={{ padding: "48px 24px", textAlign: "center", borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Sin historial aun</div>
              <div style={{ fontSize: 12, color: "#1f2937", marginBottom: 16 }}>Genera tu primer contenido para verlo aqui</div>
              <button onClick={() => setActiveTab("generator")} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 9, color: "#060609", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "sans-serif" }}>
                Ir al generador
              </button>
            </div>
          ) : history.map((h, i) => (
            <div key={i} className="ll-card" style={{ padding: "16px", marginBottom: 8, borderRadius: 12, animation: "ll-fade 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14 }}>{h.icon}</span>
                  <span style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{h.type}</span>
                  <span style={{ fontSize: 11, color: "#2d3748" }}>{h.business} · {h.topic}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "#1f2937" }}>{h.date}</span>
                  <button className="ll-ghost" onClick={() => copy(h.result)} style={{ fontSize: 10, padding: "3px 9px" }}>Copiar</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#2d3748", lineHeight: 1.6 }}>{h.result.slice(0, 200)}...</div>
            </div>
          ))}
        </div>
      )}

      {/* ── PLANS ── */}
      {activeTab === "plans" && (
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px", animation: "ll-fade 0.3s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f0ece0", marginBottom: 8 }}>
              Planes simples, resultados reales
            </h1>
            <p style={{ fontSize: 13, color: "#374151" }}>7 dias de prueba gratis en cualquier plan · Sin tarjeta de credito · Cancela cuando quieras</p>
          </div>

          {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pago") === "ok" && (
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#6ee7b7", textAlign: "center" }}>
              Pago exitoso. Tu plan fue actualizado. Recarga la pagina para ver tus nuevas generaciones.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {PLANS.map((p, i) => (
              <div key={i} style={{ background: p.popular ? "rgba(249,115,22,0.04)" : "#0d0d15", border: p.popular ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "22px 18px", position: "relative", display: "flex", flexDirection: "column" }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#060609", fontSize: 8, fontWeight: 800, padding: "3px 12px", whiteSpace: "nowrap", letterSpacing: "0.1em", borderRadius: 999 }}>MAS POPULAR</div>
                )}
                <div style={{ fontSize: 8, color: p.color, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 2, color: "#f0ece0" }}>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 400 }}>USD </span>
                  <span style={{ fontSize: 28 }}>{p.price}</span>
                  <span style={{ fontSize: 11, color: "#374151", fontWeight: 400 }}>/mes</span>
                </div>
                <div style={{ fontSize: 10, color: "#2d3748", marginBottom: 16, lineHeight: 1.4 }}>{p.desc}</div>
                <div style={{ flex: 1, marginBottom: 18 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 6, marginBottom: 7, fontSize: 11, color: "#374151", alignItems: "flex-start", lineHeight: 1.4 }}>
                      <span style={{ color: p.color, flexShrink: 0, fontWeight: 700 }}>✓</span>{f}
                    </div>
                  ))}
                </div>

                {p.disabled ? (
                  <button disabled style={{ width: "100%", padding: "9px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, color: "#1f2937", fontSize: 11, cursor: "not-allowed", fontFamily: "sans-serif" }}>{p.cta}</button>
                ) : p.name === "Agencia" ? (
                  <button onClick={() => window.open("mailto:hola@latinalabs.app?subject=Plan Agencia", "_blank")}
                    style={{ width: "100%", padding: "9px", background: "transparent", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 9, color: "#a78bfa", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: "sans-serif" }}>
                    Contactar ventas
                  </button>
                ) : (
                  <button onClick={async () => {
                    try {
                      const res = await fetch("/api/mp-checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: p.name.toLowerCase(), userId: user.id, userEmail: user.email }),
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                      else alert("Error al iniciar el pago. Intenta nuevamente.");
                    } catch (e) {
                      alert("Error de conexion. Intenta nuevamente.");
                    }
                  }}
                    style={{ width: "100%", padding: "10px", background: p.popular ? "linear-gradient(135deg,#f59e0b,#f97316)" : "rgba(0,158,227,0.06)", border: p.popular ? "none" : "1px solid rgba(0,158,227,0.2)", borderRadius: 9, color: p.popular ? "#060609" : "#38bdf8", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", letterSpacing: "0.01em" }}>
                    {p.popular ? "Suscribirse ahora" : "Suscribirse"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 20 }}>
            {[["🔐","Pagos seguros","Procesado por MercadoPago con encriptacion SSL"], ["📊","Sin permanencia","Cancelas en cualquier momento sin penalizacion"], ["💳","Multiples metodos","Tarjeta, debito, efectivo y mas opciones"]].map(([icon, title, desc], i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{title}</div>
                  <div style={{ fontSize: 10, color: "#1f2937" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "16px 24px", textAlign: "center", marginTop: 48 }}>
        <p style={{ fontSize: 11, color: "#1a1a2e" }}>LatinLabs · Powered by Claude AI</p>
      </footer>
    </div>
  );
}
