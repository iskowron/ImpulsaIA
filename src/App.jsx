import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const PLANS = [
  { name: "Starter", price: "9", color: "#f59e0b", features: ["50 generaciones/mes", "3 tipos de contenido", "Soporte por email"], cta: "Elegir Starter", popular: false },
  { name: "Pro", price: "29", color: "#f97316", features: ["500 generaciones/mes", "Todos los tipos", "Soporte prioritario", "Historial ilimitado", "Exportar PDF/Word"], cta: "Elegir Pro", popular: true },
  { name: "Agency", price: "79", color: "#ef4444", features: ["Ilimitado", "Multi-usuario (5)", "White label", "Manager dedicado"], cta: "Hablar con ventas", popular: false },
];

const CONTENT_TYPES = [
  { id: "instagram", label: "Post Instagram", icon: "📸", prompt: (b, t) => `Creá un post de Instagram atractivo para un negocio de ${b}. Tema: ${t}. Incluí texto principal (máx 150 palabras), llamado a la acción y 10 hashtags relevantes en español.` },
  { id: "email", label: "Email Marketing", icon: "📧", prompt: (b, t) => `Escribí un email de marketing para un negocio de ${b} sobre: ${t}. Tono profesional pero cercano, máx 200 palabras. Incluí asunto, saludo, cuerpo y CTA.` },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", prompt: (b, t) => `Redactá un mensaje de WhatsApp Business para ${b} sobre: ${t}. Breve (máx 80 palabras), directo, con emojis moderados y CTA claro.` },
  { id: "ads", label: "Anuncio Ads", icon: "🎯", prompt: (b, t) => `Creá un anuncio para Facebook/Instagram Ads de ${b}. Tema: ${t}. Titular (máx 40 caracteres), Descripción (máx 125 caracteres), Texto principal (máx 90 palabras) y CTA.` },
  { id: "linkedin", label: "LinkedIn", icon: "💼", prompt: (b, t) => `Escribí un post de LinkedIn para ${b} sobre: ${t}. Tono experto. Gancho inicial potente, desarrollo y conclusión. Máx 200 palabras.` },
  { id: "landing", label: "Landing Page", icon: "🚀", prompt: (b, t) => `Creá el copy hero de una landing page de ${b}. Oferta: ${t}. Headline, Subheadline, 3 beneficios clave y CTA principal.` },
];
function TypewriterText({ text, speed = 14 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else { setDone(true); clearInterval(iv); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}{!done && <span style={{ animation: "blink 1s infinite" }}>▍</span>}</span>;
}

// ── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
        setSuccess("¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.");
        setMode("login");
      }
    } catch (e) {
      setError(e.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos."
        : e.message === "User already registered"
        ? "Ya existe una cuenta con ese email."
        : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 24 }}>
      <style>{@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}}</style>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeIn 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14 }}>⚡</div>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 28, color: "#f0ece0", letterSpacing: "-0.02em" }}>
            Impulsa<span style={{ color: "#f59e0b" }}>IA</span>
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#666", marginTop: 6 }}>Marketing con IA para tu negocio</div>
        </div>

        {/* Card */}
        <div style={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 20, padding: "32px 28px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#0a0a0f", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                  background: mode === m ? "linear-gradient(135deg,#f59e0b,#f97316)" : "transparent",
                  color: mode === m ? "#0a0a0f" : "#666" }}>
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontFamily: "sans-serif", fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              placeholder="tu@email.com" type="email"
              style={{ width: "100%", padding: "11px 14px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f0ece0", fontFamily: "sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: "sans-serif", fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Contraseña</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              placeholder="mínimo 6 caracteres" type="password"
              style={{ width: "100%", padding: "11px 14px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f0ece0", fontFamily: "sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          {error && <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 13, color: "#fca5a5", marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 13, color: "#86efac", marginBottom: 16 }}>{success}</div>}

          <button onClick={handle} disabled={loading || !email || !password}
            style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 10, color: "#0a0a0f", fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: (!email || !password) ? 0.5 : 1, letterSpacing: "0.04em" }}>
            {loading ? "⟳ Procesando..." : mode === "login" ? "Entrar a ImpulsaIA" : "Crear mi cuenta gratis"}
          </button>

          {mode === "login" && (
            <div style={{ textAlign: "center", marginTop: 16, fontFamily: "sans-serif", fontSize: 12, color: "#555" }}>
              ¿No tenés cuenta?{" "}
              <span onClick={() => setMode("register")} style={{ color: "#f59e0b", cursor: "pointer" }}>Registrate gratis</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontFamily: "sans-serif", fontSize: 11, color: "#333" }}>
          Sin tarjeta de crédito · 10 generaciones gratis · Cancelá cuando quieras
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ImpulsaIA() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("generator");
  const [business, setBusiness] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Check session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user logs in
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setResult(""); setHistory([]);
  };

  const generate = async () => {
    if (!business.trim() || !topic.trim()) return;
    if (profile && profile.generaciones_usadas >= profile.generaciones_limite) {
      setResult("⚠️ Alcanzaste el límite de tu plan. Upgradeá para continuar generando contenido ilimitado.");
      return;
    }
    setLoading(true); setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Sos un experto en marketing digital para negocios latinoamericanos. Generás contenido en español rioplatense, persuasivo y auténtico. Respondés directamente con el contenido solicitado, sin explicaciones previas.",
          messages: [{ role: "user", content: selectedType.prompt(business, topic) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Error al generar.";
      setResult(text);
      setHistory(prev => [{ type: selectedType.label, business, topic, result: text, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
      // Update counter in Supabase
      if (profile) {
        const newCount = (profile.generaciones_usadas || 0) + 1;
        await supabase.from("profiles").update({ generaciones_usadas: newCount }).eq("id", user.id);
        setProfile(prev => ({ ...prev, generaciones_usadas: newCount }));
      }
    } catch {
      setResult("⚠️ Error de conexión. Verificá tu internet e intentá de nuevo.");
    }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (loadingAuth) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#f59e0b", fontFamily: "Georgia, serif", fontSize: 18 }}>⚡ Cargando...</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;

  const genUsadas = profile?.generaciones_usadas || 0;
  const genLimite = profile?.generaciones_limite || 10;
  const genPct = Math.min((genUsadas / genLimite) * 100, 100);

  return (
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh", background: "#0a0a0f", color: "#f0ece0" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#f59e0b44;border-radius:4px}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .btn-primary{background:linear-gradient(135deg,#f59e0b,#f97316);border:none;color:#0a0a0f;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:sans-serif}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px #f59e0b44}
        .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .btn-ghost{background:transparent;border:1px solid #f59e0b44;color:#f0ece0;cursor:pointer;transition:all 0.2s;font-family:sans-serif}
        .btn-ghost:hover{border-color:#f59e0b;background:#f59e0b11}
        .input-field{background:#12121a;border:1px solid #2a2a3a;color:#f0ece0;font-family:sans-serif;outline:none;transition:border 0.2s}
        .input-field:focus{border-color:#f59e0b66}
        .fade-in{animation:slideUp 0.5s ease forwards}
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e1e2e", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100, background: "#0a0a0fee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", animation: "float 3s ease infinite" }}>⚡</div>
          <span style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: 18 }}>Impulsa<span style={{ color: "#f59e0b" }}>IA</span></span>
        </div>

        <nav style={{ display: "flex", gap: 2 }}>
          {["generator", "history", "plans"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background: "none", border: "none", borderBottom: 2px solid ${activeTab === tab ? "#f59e0b" : "transparent"}, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "sans-serif", color: activeTab === tab ? "#f59e0b" : "#666", transition: "all 0.2s" }}>
              {tab === "generator" ? "⚡ Generar" : tab === "history" ? "📋 Historial" : "💎 Planes"}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Usage bar */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "sans-serif", fontSize: 10, color: "#666", marginBottom: 3 }}>{genUsadas}/{genLimite} generaciones</div>
            <div style={{ width: 80, height: 4, background: "#1e1e2e", borderRadius: 99 }}>
              <div style={{ width: ${genPct}%, height: "100%", background: genPct > 80 ? "#ef4444" : "linear-gradient(90deg,#f59e0b,#f97316)", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#555", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          <button className="btn-ghost" onClick={logout} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11 }}>Salir</button>
        </div>
      </header>

      {/* Generator Tab */}
      {activeTab === "generator" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 20px" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: 36 }}>
            <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "clamp(28px,4vw,46px)", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 10 }}>
              Tu marketing,<br />
              <span style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>en segundos</span>
            </h1>
            <p style={{ fontFamily: "sans-serif", color: "#666", fontSize: 14 }}>Hola {user.email.split("@")[0]} 👋 ¿Qué contenido necesitás hoy?</p>
          </div>

          <div style={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 18, padding: "28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontFamily: "sans-serif", fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tu negocio</label>
                <input className="input-field" value={business} onChange={e => setBusiness(e.target.value)}
                  placeholder="ej: tienda de ropa, restaurant..." style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "sans-serif", fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tema o campaña</label>
                <input className="input-field" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="ej: promo 50%, nuevo producto..." style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13 }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: "sans-serif", fontSize: 11, color: "#888", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tipo de contenido</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setSelectedType(ct)}
                    style={{ background: selectedType.id === ct.id ? "linear-gradient(135deg,#f59e0b22,#f9731611)" : "none", border: 1px solid ${selectedType.id === ct.id ? "#f59e0b66" : "#2a2a3a"}, borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{ct.icon}</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: 11, color: selectedType.id === ct.id ? "#f59e0b" : "#aaa", fontWeight: 600 }}>{ct.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Limit warning */}
            {genUsadas >= genLimite && (
              <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontFamily: "sans-serif", fontSize: 13, color: "#fca5a5", textAlign: "center" }}>
                ⚠️ Alcanzaste tu límite de {genLimite} generaciones. <span onClick={() => setActiveTab("plans")} style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 700 }}>Upgradear plan →</span>
              </div>
            )}

            <button className="btn-primary" onClick={generate} disabled={loading || !business || !topic || genUsadas >= genLimite}
              style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, letterSpacing: "0.04em" }}>
              {loading ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> : ⚡ Generar ${selectedType.label}}
              {loading && " Generando con IA..."}
            </button>

            {result && (
              <div style={{ marginTop: 20, animation: "slideUp 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: "sans-serif", fontSize: 11, color: "#f59e0b", letterSpacing: "0.08em", textTransform: "uppercase" }}>✦ Resultado</span>
                  <button className="btn-ghost" onClick={copy} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 11 }}>{copied ? "✓ Copiado!" : "Copiar"}</button>
                </div>
                <div style={{ background: "#0a0a0f", border: "1px solid #f59e0b22", borderRadius: 12, padding: "18px 20px", fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.8, color: "#ddd", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                  <TypewriterText text={result} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn-ghost" onClick={generate} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, flex: 1 }}>🔄 Regenerar</button>
                  <button className="btn-ghost" onClick={() => setResult("")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11 }}>✕ Limpiar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div style={{ maxWidth: 740, margin: "0 auto", padding: "36px 20px" }}>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Historial</h2>
          <p style={{ fontFamily: "sans-serif", color: "#666", fontSize: 13, marginBottom: 24 }}>Tus últimas generaciones de esta sesión</p>
          {history.length === 0 ? (
            <div style={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontFamily: "sans-serif", color: "#666", fontSize: 14 }}>Aún no generaste contenido en esta sesión</div>
              <button className="btn-primary" onClick={() => setActiveTab("generator")} style={{ marginTop: 16, padding: "9px 22px", borderRadius: 10, fontSize: 13 }}>⚡ Ir al generador</button>
            </div>
          ) : history.map((h, i) => (
            <div key={i} className="fade-in" style={{ background: "#12121a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 18, marginBottom: 10, animationDelay: ${i * 0.05}s }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ background: "#f59e0b22", color: "#f59e0b", padding: "2px 10px", borderRadius: 999, fontSize: 10, fontFamily: "sans-serif", fontWeight: 700 }}>{h.type}</span>
                  <span style={{ fontFamily: "sans-serif", fontSize: 12, color: "#666" }}>{h.business} · {h.topic}</span>
                </div>
                <span style={{ fontFamily: "sans-serif", fontSize: 10, color: "#444" }}>{h.date}</span>
              </div>
              <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#888", lineHeight: 1.6 }}>{h.result.slice(0, 180)}...</div>
            </div>
          ))}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 10 }}>
              Elegí tu plan de <span style={{ color: "#f59e0b" }}>crecimiento</span>
            </h2>
            <p style={{ fontFamily: "sans-serif", color: "#666", fontSize: 14 }}>Todos los planes incluyen 7 días de prueba gratis.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {PLANS.map((p, i) => (
              <div key={i} className="fade-in" style={{ background: "#12121a", border: 1px solid ${p.popular ? "#f97316" : "#1e1e2e"}, borderRadius: 18, padding: 24, position: "relative", animationDelay: ${i * 0.1}s }}>
                {p.popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0a0a0f", fontSize: 9, fontWeight: 800, padding: "3px 12px", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>MÁS POPULAR</div>}
                <div style={{ fontFamily: "sans-serif", fontSize: 10, color: p.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>Plan {p.name}</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
                  <span style={{ fontSize: 16, color: "#666" }}>USD </span>{p.price}<span style={{ fontSize: 13, color: "#666", fontFamily: "sans-serif" }}>/mes</span>
                </div>
                <div style={{ marginBottom: 22 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, fontFamily: "sans-serif", fontSize: 12, color: "#ccc" }}>
                      <span style={{ color: p.color }}>✦</span> {f}
                    </div>
                  ))}
                </div>
                <button className={p.popular ? "btn-primary" : "btn-ghost"}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 12, letterSpacing: "0.04em" }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer style={{ borderTop: "1px solid #1e1e2e", padding: 20, textAlign: "center", marginTop: 40 }}>
        <p style={{ fontFamily: "sans-serif", fontSize: 11, color: "#333" }}>
          ImpulsaIA · 
        </p>
      </footer>
    </div>
  );
}
