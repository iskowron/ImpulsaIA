import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

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
  { id: "otro", label: "Otro", icon: "✦" },
];

const RUBRO_TONE = {
  ropa: "usa lenguaje trendy, referencias a moda y estilo",
  gastronomia: "usa lenguaje apetitoso y sensorial que invite a saborear",
  belleza: "usa lenguaje que transmita glamour y autocuidado",
  salud: "usa lenguaje motivador y empoderador orientado al bienestar",
  tecnologia: "usa lenguaje claro y moderno orientado a beneficios concretos",
  educacion: "usa lenguaje que inspire curiosidad y crecimiento personal",
  inmobiliaria: "usa lenguaje de confianza y solidez",
  veterinaria: "usa lenguaje calido y empatico que transmita amor por las mascotas",
  coaching: "usa lenguaje inspirador orientado a resultados y transformacion",
  otro: "usa lenguaje profesional claro y persuasivo",
};

const CONTENT_TYPES = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬", prompt: (b, t, r) => "Redacta un mensaje de WhatsApp Business para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Maximo 80 palabras, directo, emojis moderados y CTA claro. Solo el mensaje." },
  { id: "instagram", label: "Post Instagram", icon: "📸", prompt: (b, t, r) => "Crea un post de Instagram para " + b + ". Tema: " + t + ". " + (RUBRO_TONE[r] || "") + ". Texto maximo 150 palabras, CTA poderoso y 10 hashtags. Solo el contenido." },
  { id: "stories", label: "Stories IG", icon: "⭕", prompt: (b, t, r) => "Crea una secuencia de 5 stories de Instagram para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Cada story: texto corto maximo 15 palabras, sticker sugerido y CTA. Formato: Story 1: [texto] | Sticker: [tipo] | CTA: [accion]" },
  { id: "email", label: "Email", icon: "📧", prompt: (b, t, r) => "Escribe un email de marketing para " + b + " sobre: " + t + ". " + (RUBRO_TONE[r] || "") + ". Incluye: Asunto, Preencabezado, Saludo, Cuerpo maximo 200 palabras y CTA." },
  { id: "ads", label: "Anuncio Ads", icon: "🎯", prompt: (b, t, r) => "Crea un anuncio Facebook/Instagram Ads para " + b + ". Tema: " + t + ". " + (RUBRO_TONE[r] || "") + ". Titular maximo 40 caracteres, Descripcion maximo 125 caracteres, Texto principal maximo 90 palabras y CTA boton." },
  { id: "linkedin", label: "LinkedIn", icon: "💼", prompt: (b, t, r) => "Escribe un post de LinkedIn para " + b + " sobre: " + t + ". Tono experto. Gancho inicial impactante, desarrollo con valor real, CTA final. Maximo 200 palabras." },
  { id: "landing", label: "Landing Page", icon: "🚀", prompt: (b, t, r) => "Crea el copy hero de una landing page para " + b + ". Oferta: " + t + ". " + (RUBRO_TONE[r] || "") + ". H1 maximo 8 palabras, H2 maximo 15 palabras, 3 beneficios clave con emoji y CTA boton." },
];

const PLANS = [
  { name: "Gratis", price: "0", pricePesos: "0", color: "#555", desc: "Para explorar", features: ["10 generaciones/mes", "3 tipos de contenido", "Sin calendario"], cta: "Plan actual", limit: 10, popular: false, disabled: true },
  { name: "Emprendedor", price: "9", pricePesos: "9.000", color: "#f59e0b", desc: "Para negocios que arrancan", features: ["100 generaciones/mes", "Todos los tipos + Stories", "Calendario 7 dias", "Plantillas por rubro", "Analisis de calidad"], cta: "Comenzar ahora", limit: 100, popular: false, disabled: false },
  { name: "Pro", price: "29", pricePesos: "29.000", color: "#f97316", desc: "Para negocios en crecimiento", features: ["500 generaciones/mes", "Todo lo anterior", "Calendario 30 dias", "Soporte prioritario"], cta: "Elegir Pro", limit: 500, popular: true, disabled: false },
  { name: "Agencia", price: "79", pricePesos: "79.000", color: "#ef4444", desc: "Para agencias y equipos", features: ["Generaciones ilimitadas", "5 cuentas usuario", "White label", "Manager dedicado"], cta: "Hablar con ventas", limit: 99999, popular: false, disabled: false },
];

const TIPS = [
  "La consistencia vende mas que la perfeccion. Publica aunque no sea perfecto.",
  "El 80% del engagement ocurre en las primeras 2 horas. Publica cuando tu audiencia esta activa.",
  "Los negocios que publican 5+ veces por semana crecen 3x mas rapido.",
  "WhatsApp tiene 98% de tasa de apertura vs 20% del email. Usalo mas.",
  "Las stories con preguntas generan 4x mas respuestas que las stories normales.",
  "El primer renglon de tu post decide si te leen o no. Hacelo irresistible.",
];

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
  return <span>{displayed}{!done && <span style={{ opacity: 0.6 }}>|</span>}</span>;
}

function QualityBadge({ score, nivel, engagement, cta, mejora }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: mejora ? 8 : 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2.5px solid " + color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{score}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f0ece0" }}>Calidad: {nivel}</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>Engagement: {engagement} · CTA: {cta}</div>
        </div>
      </div>
      {mejora && <div style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.07)", borderRadius: 7, padding: "6px 9px" }}>Mejora: {mejora}</div>}
    </div>
  );
}

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
        setSuccess("Cuenta creada. Revisa tu email para confirmar y luego inicia sesion.");
        setMode("login");
      }
    } catch (e) {
      setError(e.message === "Invalid login credentials" ? "Email o contrasena incorrectos." : e.message === "User already registered" ? "Ya existe una cuenta con ese email." : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07070d", display: "flex", fontFamily: "sans-serif" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>⚡</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f0ece0", letterSpacing: "-0.03em" }}>Impulsa<span style={{ color: "#f59e0b" }}>IA</span></div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 5 }}>Marketing profesional para tu negocio</div>
          </div>

          <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 18, padding: "26px 22px" }}>
            <div style={{ display: "flex", background: "#07070d", borderRadius: 9, padding: 3, marginBottom: 20 }}>
              {["login", "register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{ flex: 1, padding: "7px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: mode === m ? "linear-gradient(135deg,#f59e0b,#f97316)" : "transparent", color: mode === m ? "#07070d" : "#444" }}>
                  {m === "login" ? "Iniciar sesion" : "Crear cuenta"}
                </button>
              ))}
            </div>

            {["email", "password"].map(field => (
              <div key={field} style={{ marginBottom: field === "email" ? 11 : 16 }}>
                <label style={{ display: "block", fontSize: 9, color: "#444", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{field === "email" ? "Email" : "Contrasena"}</label>
                <input value={field === "email" ? email : password} onChange={e => field === "email" ? setEmail(e.target.value) : setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handle()} placeholder={field === "email" ? "tu@email.com" : "minimo 6 caracteres"} type={field}
                  style={{ width: "100%", padding: "10px 13px", background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 9, color: "#f0ece0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 7, padding: "8px 11px", fontSize: 12, color: "#fca5a5", marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 7, padding: "8px 11px", fontSize: 12, color: "#86efac", marginBottom: 12 }}>{success}</div>}

            <button onClick={handle} disabled={loading || !email || !password}
              style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 9, color: "#07070d", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: (!email || !password) ? 0.4 : 1 }}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta gratis"}
            </button>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#333" }}>
              {mode === "login" ? "No tenes cuenta? " : "Ya tenes cuenta? "}
              <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "#f59e0b", cursor: "pointer" }}>
                {mode === "login" ? "Registrate gratis" : "Iniciar sesion"}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 14, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 9, padding: "11px 13px" }}>
            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Consejo del dia</div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>{tip}</div>
          </div>

          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "#2a2a3a" }}>Sin tarjeta de credito · 10 generaciones gratis</div>
        </div>
      </div>

      <div style={{ width: 320, background: "#0a0a12", borderLeft: "1px solid #1a1a2e", display: "flex", flexDirection: "column", justifyContent: "center", padding: 36 }}>
        <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Por que ImpulsaIA</div>
        {[
          ["💬", "WhatsApp primero", "Disenado para como vende LATAM"],
          ["🎯", "Por rubro", "Habla como habla tu cliente"],
          ["📅", "Calendario completo", "7 o 30 dias con un clic"],
          ["⭕", "Stories que venden", "El formato mas ignorado por las herramientas"],
          ["⭐", "Analisis de calidad", "Sabe si tu copy va a convertir"],
        ].map(([icon, title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, background: "rgba(245,158,11,0.08)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#444", lineHeight: 1.4 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ImpulsaIA() {
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
  const [tipIndex] = useState(Math.floor(Math.random() * TIPS.length));

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
      body: JSON.stringify({ system: system || "Sos un experto en marketing digital para negocios latinoamericanos. Respondés directamente con el contenido solicitado, sin explicaciones previas.", prompt }),
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
      setHistory(prev => [{ type: selectedType.label, business, topic, result: text, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
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
      const prompt = "Analiza este contenido de marketing y devuelve SOLO un JSON sin markdown: {\"score\":85,\"nivel\":\"Alto\",\"engagement\":\"Alto\",\"cta\":\"Fuerte\",\"mejora\":\"sugerencia corta\"}. Contenido: " + text.slice(0, 300);
      const raw = await callAPI(prompt, "Eres un analizador de marketing. Responde SOLO con JSON valido sin markdown ni texto adicional.");
      const clean = raw.replace(/```json|```/g, "").trim();
      setQuality(JSON.parse(clean));
    } catch { /* silently fail */ }
    setAnalyzingQuality(false);
  };

  const generateCalendar = async () => {
    if (!business.trim() || !topic.trim()) return;
    setCalLoading(true); setCalResult("");
    try {
      const prompt = "Crea un calendario de contenido de " + calDays + " dias para " + business + " con tema central: " + topic + ". " + (RUBRO_TONE[selectedRubro] || "") + ". Para cada dia: Dia X - Tipo: [red social] - Tema especifico: [tema] - Idea clave: [descripcion maximo 20 palabras]. Varia los tipos y temas. Solo el calendario.";
      const text = await callAPI(prompt);
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
    <div style={{ minHeight: "100vh", background: "#07070d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#f59e0b", fontSize: 14, fontFamily: "sans-serif" }}>Cargando...</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;

  const genUsadas = profile?.generaciones_usadas || 0;
  const genLimite = profile?.generaciones_limite || 10;
  const genPct = Math.min((genUsadas / genLimite) * 100, 100);
  const atLimit = genUsadas >= genLimite;
  const rubroActual = RUBROS.find(r => r.id === selectedRubro);

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#07070d", color: "#f0ece0" }}>

      {showOnboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 20, padding: 30, maxWidth: 440, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 5 }}>Bienvenido a ImpulsaIA</div>
              <div style={{ fontSize: 12, color: "#555" }}>A que se dedica tu negocio? Asi personalizamos el contenido para vos.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {RUBROS.map(r => (
                <button key={r.id} onClick={() => saveRubro(r.id)}
                  style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 9, padding: "11px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "border-color 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.borderColor = "#f59e0b"}
                  onMouseOut={e => e.currentTarget.style.borderColor = "#1a1a2e"}>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <span style={{ fontSize: 11, color: "#bbb", fontWeight: 500 }}>{r.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowOnboarding(false)} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer" }}>Saltar por ahora</button>
          </div>
        </div>
      )}

      <header style={{ borderBottom: "1px solid #1a1a2e", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100, background: "#07070dee", backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.03em" }}>Impulsa<span style={{ color: "#f59e0b" }}>IA</span></span>
        </div>

        <nav style={{ display: "flex" }}>
          {[["generator","Generar"], ["calendar","Calendario"], ["history","Historial"], ["plans","Planes"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #f59e0b" : "2px solid transparent", padding: "5px 13px", cursor: "pointer", fontSize: 12, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "#f59e0b" : "#444", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, color: "#444", marginBottom: 2, textAlign: "right" }}>{genUsadas}/{genLimite}</div>
            <div style={{ width: 64, height: 3, background: "#1a1a2e", borderRadius: 99 }}>
              <div style={{ width: genPct + "%", height: "100%", background: genPct > 80 ? "#ef4444" : "#f59e0b", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
          </div>
          <button onClick={() => setShowOnboarding(true)} title="Cambiar rubro"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontSize: 13 }}>
            {rubroActual?.icon || "✦"}
          </button>
          <button onClick={logout} style={{ background: "none", border: "1px solid #1a1a2e", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 10, color: "#444" }}>Salir</button>
        </div>
      </header>

      <div style={{ background: "linear-gradient(90deg,rgba(245,158,11,0.06),transparent)", borderBottom: "1px solid rgba(245,158,11,0.08)", padding: "7px 20px", display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Tip</span>
        <span style={{ fontSize: 11, color: "#555" }}>{TIPS[tipIndex]}</span>
      </div>

      {activeTab === "generator" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "#555", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Rubro</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {RUBROS.map(r => (
                <button key={r.id} onClick={() => setSelectedRubro(r.id)}
                  style={{ background: selectedRubro === r.id ? "rgba(245,158,11,0.12)" : "#0e0e18", border: selectedRubro === r.id ? "1px solid rgba(245,158,11,0.4)" : "1px solid #1a1a2e", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontSize: 10, color: selectedRubro === r.id ? "#f59e0b" : "#555", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 16, padding: "22px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 16 }}>
              {[["business", "Tu negocio", "ej: tienda de ropa femenina..."], ["topic", "Tema o campana", "ej: 50% off en temporada..."]].map(([field, lbl, ph]) => (
                <div key={field}>
                  <label style={{ display: "block", fontSize: 9, color: "#555", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{lbl}</label>
                  <input value={field === "business" ? business : topic} onChange={e => field === "business" ? setBusiness(e.target.value) : setTopic(e.target.value)} placeholder={ph}
                    style={{ width: "100%", padding: "9px 12px", background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 8, color: "#f0ece0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#555", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tipo de contenido</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setSelectedType(ct)}
                    style={{ background: selectedType.id === ct.id ? "rgba(245,158,11,0.1)" : "#07070d", border: selectedType.id === ct.id ? "1px solid rgba(245,158,11,0.35)" : "1px solid #1a1a2e", borderRadius: 8, padding: "9px 7px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 15, marginBottom: 3 }}>{ct.icon}</div>
                    <div style={{ fontSize: 9, color: selectedType.id === ct.id ? "#f59e0b" : "#555", fontWeight: 600, lineHeight: 1.3 }}>{ct.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {atLimit && (
              <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "10px 13px", marginBottom: 12, fontSize: 11, color: "#fca5a5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Alcanzaste tu limite de generaciones</span>
                <span onClick={() => setActiveTab("plans")} style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>Ver planes</span>
              </div>
            )}

            <button onClick={generate} disabled={loading || !business || !topic || atLimit}
              style={{ width: "100%", padding: "11px", background: loading || atLimit ? "#1a1a2e" : "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 9, color: loading || atLimit ? "#444" : "#07070d", fontWeight: 700, fontSize: 13, cursor: loading || atLimit ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {loading ? "Generando..." : "Generar " + selectedType.label + " · " + (rubroActual?.label || "negocio")}
            </button>

            {result && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Resultado</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => copy(result)} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 6, padding: "3px 11px", cursor: "pointer", fontSize: 10, color: "#f59e0b" }}>{copied ? "Copiado!" : "Copiar"}</button>
                    <button onClick={generate} style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 6, padding: "3px 11px", cursor: "pointer", fontSize: 10, color: "#555" }}>Regenerar</button>
                    <button onClick={() => setResult("")} style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 6, padding: "3px 11px", cursor: "pointer", fontSize: 10, color: "#555" }}>Limpiar</button>
                  </div>
                </div>
                <div style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 10, padding: "14px 16px", fontSize: 12, lineHeight: 1.8, color: "#bbb", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                  <TypewriterText text={result} />
                </div>
                {analyzingQuality && <div style={{ marginTop: 8, fontSize: 10, color: "#444", textAlign: "center" }}>Analizando calidad...</div>}
                {quality && !analyzingQuality && <QualityBadge {...quality} />}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginTop: 14 }}>
            {[["💬","WhatsApp primero","98% apertura en LATAM"], ["⭕","Stories que convierten","4x mas respuestas con preguntas"], ["📅","Publica consistente","5+ veces por semana = 3x crecimiento"]].map(([icon, title, desc], i) => (
              <div key={i} style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 10, padding: "12px" }}>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 10, color: "#444", lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Calendario de contenido</h2>
            <p style={{ fontSize: 12, color: "#555" }}>Genera un plan completo de publicaciones. Consistencia es la clave.</p>
          </div>

          <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 16, padding: "22px", marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 16 }}>
              {[["business", "Tu negocio", "ej: cafeteria artesanal..."], ["topic", "Tema central", "ej: temporada de invierno..."]].map(([field, lbl, ph]) => (
                <div key={field}>
                  <label style={{ display: "block", fontSize: 9, color: "#555", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{lbl}</label>
                  <input value={field === "business" ? business : topic} onChange={e => field === "business" ? setBusiness(e.target.value) : setTopic(e.target.value)} placeholder={ph}
                    style={{ width: "100%", padding: "9px 12px", background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 8, color: "#f0ece0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#555", marginBottom: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>Cuantos dias</div>
              <div style={{ display: "flex", gap: 7 }}>
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setCalDays(d)}
                    style={{ padding: "7px 18px", borderRadius: 7, border: calDays === d ? "1px solid rgba(245,158,11,0.4)" : "1px solid #1a1a2e", background: calDays === d ? "rgba(245,158,11,0.1)" : "#07070d", color: calDays === d ? "#f59e0b" : "#555", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {d} dias
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generateCalendar} disabled={calLoading || !business || !topic}
              style={{ width: "100%", padding: "11px", background: calLoading ? "#1a1a2e" : "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 9, color: calLoading ? "#444" : "#07070d", fontWeight: 700, fontSize: 13, cursor: calLoading ? "not-allowed" : "pointer" }}>
              {calLoading ? "Generando calendario..." : "Generar calendario de " + calDays + " dias"}
            </button>

            {calResult && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tu calendario</span>
                  <button onClick={() => copy(calResult)} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 6, padding: "3px 11px", cursor: "pointer", fontSize: 10, color: "#f59e0b" }}>Copiar todo</button>
                </div>
                <div style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 10, padding: "14px 16px", fontSize: 12, lineHeight: 1.9, color: "#bbb", whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto" }}>
                  <TypewriterText text={calResult} speed={5} />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 10, padding: "14px 16px", fontSize: 11, color: "#555", lineHeight: 1.7 }}>
            <span style={{ color: "#f59e0b", fontWeight: 600 }}>Consejo de experto: </span>
            Los negocios que planifican su contenido con anticipacion generan 3x mas engagement. No necesitas publicar perfecto, necesitas publicar consistente. 90 dias de constancia cambian cualquier negocio.
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Historial</h2>
          <p style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>Tus ultimas 20 generaciones de esta sesion</p>
          {history.length === 0 ? (
            <div style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 14, padding: 36, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 12, color: "#444" }}>Aun no generaste contenido en esta sesion</div>
              <button onClick={() => setActiveTab("generator")} style={{ marginTop: 12, padding: "8px 20px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 8, color: "#07070d", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Ir al generador</button>
            </div>
          ) : history.map((h, i) => (
            <div key={i} style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 700 }}>{h.type}</span>
                  <span style={{ fontSize: 10, color: "#444" }}>{h.business} · {h.topic}</span>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "#2a2a3a" }}>{h.date}</span>
                  <button onClick={() => copy(h.result)} style={{ background: "#07070d", border: "1px solid #1a1a2e", borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontSize: 9, color: "#555" }}>Copiar</button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>{h.result.slice(0, 180)}...</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "plans" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: "clamp(20px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 7 }}>Elegí tu plan de crecimiento</h2>
            <p style={{ fontSize: 12, color: "#555" }}>7 dias de prueba gratis · Sin tarjeta · Cancela cuando quieras</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {PLANS.map((p, i) => (
              <div key={i} style={{ background: "#0e0e18", border: p.popular ? "1px solid rgba(249,115,22,0.4)" : "1px solid #1a1a2e", borderRadius: 14, padding: 18, position: "relative" }}>
                {p.popular && <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#07070d", fontSize: 7, fontWeight: 800, padding: "2px 9px", whiteSpace: "nowrap", letterSpacing: "0.08em" }}>MAS POPULAR</div>}
                <div style={{ fontSize: 8, color: p.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 1 }}>
                  <span style={{ fontSize: 11, color: "#444" }}>USD </span>{p.price}
                  <span style={{ fontSize: 10, color: "#444" }}>/mes</span>
                </div>
                {p.price !== "0" && <div style={{ fontSize: 9, color: "#333", marginBottom: 8 }}>ARS {p.pricePesos}/mes</div>}
                <div style={{ fontSize: 10, color: "#444", marginBottom: 14, lineHeight: 1.4 }}>{p.desc}</div>
                <div style={{ marginBottom: 16 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 5, marginBottom: 6, fontSize: 10, color: "#666", alignItems: "flex-start", lineHeight: 1.4 }}>
                      <span style={{ color: p.color, flexShrink: 0 }}>✦</span>{f}
                    </div>
                  ))}
                </div>
                <button disabled={p.disabled}
                  style={{ width: "100%", padding: "8px", background: p.popular ? "linear-gradient(135deg,#f59e0b,#f97316)" : "transparent", border: p.popular ? "none" : "1px solid #1a1a2e", borderRadius: 8, color: p.popular ? "#07070d" : p.disabled ? "#2a2a3a" : "#666", fontWeight: 600, fontSize: 10, cursor: p.disabled ? "not-allowed" : "pointer" }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginTop: 22 }}>
            {[["🔐","Pagos seguros","Stripe y MercadoPago"], ["📊","Sin contrato","Cancelas cuando quieras"], ["🇦🇷","Precios en ARS","Paga en pesos si preferis"]].map(([icon, title, desc], i) => (
              <div key={i} style={{ background: "#0e0e18", border: "1px solid #1a1a2e", borderRadius: 9, padding: "12px", display: "flex", gap: 9, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#bbb" }}>{title}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer style={{ borderTop: "1px solid #1a1a2e", padding: "14px 20px", textAlign: "center", marginTop: 40 }}>
        <p style={{ fontSize: 10, color: "#1a1a2e" }}>ImpulsaIA · Misiones, Argentina · Powered by Claude AI</p>
      </footer>
    </div>
  );
}
