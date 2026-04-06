import { useState, useEffect, useRef } from "react";

const PLANS = [
  {
    name: "Starter",
    price: "9",
    color: "#f59e0b",
    desc: "Para emprendedores que arrancan",
    features: ["50 generaciones/mes", "3 tipos de contenido", "Soporte por email", "Historial 7 días"],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "29",
    color: "#f97316",
    desc: "Para negocios en crecimiento",
    features: ["500 generaciones/mes", "Todos los tipos", "Soporte prioritario", "Historial ilimitado", "Exportar a PDF/Word", "API access"],
    cta: "Elegir Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: "79",
    color: "#ef4444",
    desc: "Para agencias y equipos",
    features: ["Ilimitado", "Multi-usuario (5)", "White label", "Integración Zapier", "Manager dedicado", "Onboarding incluido"],
    cta: "Hablar con ventas",
    popular: false,
  },
];

const CONTENT_TYPES = [
  { id: "instagram", label: "Post Instagram", icon: "📸", prompt: (b, t) => `Creá un post de Instagram atractivo para un negocio de ${b}. Tema: ${t}. Incluí texto principal (máx 150 palabras), llamado a la acción y 10 hashtags relevantes en español. Formato claro con secciones.` },
  { id: "email", label: "Email Marketing", icon: "📧", prompt: (b, t) => `Escribí un email de marketing para un negocio de ${b}. Asunto y cuerpo del email sobre: ${t}. Tono profesional pero cercano, máx 200 palabras. Incluí asunto, saludo, cuerpo y cierre con CTA.` },
  { id: "whatsapp", label: "Mensaje WhatsApp", icon: "💬", prompt: (b, t) => `Redactá un mensaje de WhatsApp Business para ${b} sobre: ${t}. Debe ser breve (máx 80 palabras), directo, con emojis moderados y un CTA claro. Perfecto para enviar a clientes.` },
  { id: "ads", label: "Anuncio Publicitario", icon: "🎯", prompt: (b, t) => `Creá un anuncio publicitario para Facebook/Instagram Ads de un negocio de ${b}. Tema: ${t}. Incluí: Titular (máx 40 caracteres), Descripción (máx 125 caracteres), Texto principal (máx 90 palabras) y CTA. Orientado a conversión.` },
  { id: "linkedin", label: "Post LinkedIn", icon: "💼", prompt: (b, t) => `Escribí un post de LinkedIn para posicionar a un profesional/empresa de ${b} sobre el tema: ${t}. Tono experto, inspirador. Incluí gancho inicial potente, desarrollo y conclusión. Máx 200 palabras. Sin hashtags genéricos.` },
  { id: "landing", label: "Copy Landing Page", icon: "🚀", prompt: (b, t) => `Creá el copy completo para la sección hero de una landing page de ${b}. Tema/oferta: ${t}. Incluí: Headline principal, Subheadline, 3 beneficios clave (con bullet points), y CTA principal. Orientado a conversión máxima.` },
];

const STATS = [
  { value: "12.400+", label: "Emprendedores activos" },
  { value: "980K+", label: "Contenidos generados" },
  { value: "19 países", label: "Latinoamérica y España" },
  { value: "4.9★", label: "Valoración promedio" },
];

function TypewriterText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span>
      {displayed}
      {!done && <span style={{ animation: "blink 1s infinite", opacity: 1 }}>▍</span>}
    </span>
  );
}

export default function ImpulsaIA() {
  const [activeTab, setActiveTab] = useState("generator");
  const [business, setBusiness] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [animIn, setAnimIn] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setAnimIn(true), 100);
  }, []);

  const generate = async () => {
    if (!business.trim() || !topic.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Sos un experto en marketing digital para negocios latinoamericanos. Generás contenido en español rioplatense, persuasivo, auténtico y adaptado a cada plataforma. Siempre respondés directamente con el contenido solicitado, sin explicaciones previas.",
          messages: [{ role: "user", content: selectedType.prompt(business, topic) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Error al generar contenido.";
      setResult(text);
      setHistory(prev => [{ type: selectedType.label, business, topic, result: text, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
    } catch {
      setResult("⚠️ Error de conexión. Verificá tu internet e intentá de nuevo.");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: "100vh", background: "#0a0a0f", color: "#f0ece0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0a0f; } ::-webkit-scrollbar-thumb { background: #f59e0b44; border-radius: 4px; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px #f59e0b33} 50%{box-shadow:0 0 40px #f59e0b66} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .fade-in { animation: slideUp 0.6s ease forwards; }
        .btn-primary { background: linear-gradient(135deg, #f59e0b, #f97316); border: none; color: #0a0a0f; font-weight: 700; cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px #f59e0b55; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-ghost { background: transparent; border: 1px solid #f59e0b44; color: #f0ece0; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .btn-ghost:hover { border-color: #f59e0b; background: #f59e0b11; }
        .input-field { background: #12121a; border: 1px solid #2a2a3a; color: #f0ece0; font-family: 'DM Sans', sans-serif; outline: none; transition: border 0.2s; }
        .input-field:focus { border-color: #f59e0b66; }
        .card { background: #12121a; border: 1px solid #1e1e2e; }
        .tab-active { background: linear-gradient(135deg, #f59e0b22, #f9731611); border-bottom: 2px solid #f59e0b; color: #f59e0b; }
        .tab-inactive { color: #888; border-bottom: 2px solid transparent; }
        .tab-inactive:hover { color: #f0ece0; }
        .type-active { background: linear-gradient(135deg, #f59e0b22, #f9731611); border: 1px solid #f59e0b66; }
        .type-inactive { border: 1px solid #2a2a3a; }
        .type-inactive:hover { border-color: #f59e0b44; }
        .plan-popular { border: 1px solid #f97316; position: relative; }
        .plan-popular::before { content: 'MÁS POPULAR'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg,#f59e0b,#f97316); color: #0a0a0f; font-size: 10px; font-weight: 800; padding: 3px 12px; letter-spacing: 0.1em; font-family:'DM Sans',sans-serif; }
        .loading-spinner { animation: spin 0.8s linear infinite; display: inline-block; }
        .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e1e2e", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, background: "#0a0a0fee", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, animation: "float 3s ease infinite" }}>⚡</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 20, letterSpacing: "-0.02em" }}>Impulsa<span style={{ color: "#f59e0b" }}>IA</span></span>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {["generator","history","plans"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "tab-active" : "tab-inactive"}
              style={{ background: "none", border: "none", borderBottom: "2px solid", padding: "6px 16px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.05em", textTransform: "capitalize", transition: "all 0.2s" }}>
              {tab === "generator" ? "⚡ Generar" : tab === "history" ? "📋 Historial" : "💎 Planes"}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse-glow 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans',sans-serif" }}>IA Activa</span>
        </div>
      </header>

      {/* Hero */}
      {activeTab === "generator" && (
        <div style={{ opacity: animIn ? 1 : 0, transition: "opacity 0.8s", padding: "48px 24px 32px", maxWidth: 900, margin: "0 auto" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 999, padding: "4px 16px", marginBottom: 16, fontSize: 12, color: "#f59e0b", fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ✦ Powered by Claude AI
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.03em" }}>
              Marketing de nivel<br />
              <span style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>mundial para tu negocio</span>
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#888", fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Generá contenido profesional en segundos con IA entrenada para el mercado latinoamericano.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 40 }}>
            {STATS.map((s, i) => (
              <div key={i} className="card fade-in" style={{ padding: "16px 12px", textAlign: "center", borderRadius: 12, animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{s.value}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#666", marginTop: 4, letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Generator Card */}
          <div className="card fade-in" style={{ borderRadius: 20, padding: "32px", animationDelay: "0.3s", background: "linear-gradient(145deg, #12121a, #0e0e18)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#888", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tu negocio</label>
                <input className="input-field" value={business} onChange={e => setBusiness(e.target.value)}
                  placeholder="ej: tienda de ropa, restaurante, coaching..."
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#888", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tema o campaña</label>
                <input className="input-field" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="ej: descuento 50%, lanzamiento nuevo producto..."
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14 }} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#888", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tipo de contenido</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setSelectedType(ct)}
                    className={selectedType.id === ct.id ? "type-active" : "type-inactive"}
                    style={{ background: "none", borderRadius: 10, padding: "12px 10px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{ct.icon}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: selectedType.id === ct.id ? "#f59e0b" : "#ccc", fontWeight: 500 }}>{ct.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={generate} disabled={loading || !business || !topic}
              style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, letterSpacing: "0.05em" }}>
              {loading ? <><span className="loading-spinner">⟳</span> Generando con IA...</> : `⚡ Generar ${selectedType.label}`}
            </button>

            {result && (
              <div style={{ marginTop: 24, animation: "slideUp 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#f59e0b", letterSpacing: "0.08em", textTransform: "uppercase" }}>✦ {selectedType.label} generado</span>
                  <button className="btn-ghost" onClick={copy} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12 }}>
                    {copied ? "✓ Copiado!" : "Copiar"}
                  </button>
                </div>
                <div style={{ background: "#0a0a0f", border: "1px solid #f59e0b22", borderRadius: 14, padding: "20px 22px", fontFamily: "'DM Sans',sans-serif", fontSize: 14, lineHeight: 1.8, color: "#ddd", whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto" }}>
                  <TypewriterText text={result} speed={12} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn-ghost" onClick={generate} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, flex: 1 }}>🔄 Regenerar</button>
                  <button className="btn-ghost" onClick={() => { setBusiness(""); setTopic(""); setResult(""); }} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12 }}>✕ Limpiar</button>
                </div>
              </div>
            )}
          </div>

          {/* Features Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 24 }}>
            {[
              { icon: "🧠", title: "IA Especializada", desc: "Entrenada con miles de campañas exitosas de LATAM" },
              { icon: "⚡", title: "Instantáneo", desc: "Resultados en menos de 5 segundos, listos para usar" },
              { icon: "🌎", title: "100% Español", desc: "Tono rioplatense, neutro o español según tu región" },
            ].map((f, i) => (
              <div key={i} className="card fade-in" style={{ borderRadius: 14, padding: "20px", animationDelay: `${0.4 + i * 0.1}s` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#666", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Historial de generaciones</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", color: "#666", fontSize: 14, marginBottom: 28 }}>Tus últimos 10 contenidos generados en esta sesión</p>
          {history.length === 0 ? (
            <div className="card" style={{ borderRadius: 16, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 8 }}>Sin historial aún</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#666", fontSize: 14 }}>Generá tu primer contenido para verlo aquí</div>
              <button className="btn-primary" onClick={() => setActiveTab("generator")} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, fontSize: 14 }}>⚡ Ir al generador</button>
            </div>
          ) : history.map((h, i) => (
            <div key={i} className="card fade-in" style={{ borderRadius: 14, padding: 20, marginBottom: 12, animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ background: "#f59e0b22", color: "#f59e0b", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{h.type}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#888" }}>{h.business} · {h.topic}</span>
                </div>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#555" }}>{h.date}</span>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#aaa", lineHeight: 1.6, maxHeight: 80, overflow: "hidden", position: "relative" }}>
                {h.result.slice(0, 200)}...
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plans */}
      {activeTab === "plans" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Elegí tu plan de <span style={{ color: "#f59e0b" }}>crecimiento</span>
            </h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", color: "#666", fontSize: 15 }}>Todos los planes incluyen 7 días de prueba gratis. Sin tarjeta de crédito.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {PLANS.map((p, i) => (
              <div key={i} className={p.popular ? "plan-popular card fade-in" : "card fade-in"}
                style={{ borderRadius: 20, padding: 28, cursor: "pointer", animationDelay: `${i * 0.1}s`, transition: "transform 0.2s", transform: selectedPlan === i ? "translateY(-6px)" : "none" }}
                onClick={() => setSelectedPlan(i)}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: p.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Plan {p.name}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, color: "#888" }}>USD </span>{p.price}
                  <span style={{ fontSize: 14, color: "#666", fontFamily: "'DM Sans',sans-serif" }}>/mes</span>
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#666", marginBottom: 24 }}>{p.desc}</div>
                <div style={{ marginBottom: 28 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#ccc" }}>
                      <span style={{ color: p.color, fontSize: 12 }}>✦</span> {f}
                    </div>
                  ))}
                </div>
                <button className={p.popular ? "btn-primary" : "btn-ghost"}
                  style={{ width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, letterSpacing: "0.05em" }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {["💳 Pagos seguros con Stripe & MercadoPago", "🔒 Datos encriptados SSL", "🇦🇷 Facturación en pesos o dólares"].map((item, i) => (
              <div key={i} style={{ textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#555", padding: 16, border: "1px solid #1e1e2e", borderRadius: 10 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1e1e2e", padding: "24px", textAlign: "center", marginTop: 48 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Impulsa<span style={{ color: "#f59e0b" }}>IA</span>
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#444" }}>
          Hecho con ⚡ desde Misiones, Argentina · Powered by Claude AI · © 2026
        </p>
      </footer>
    </div>
  );
}
