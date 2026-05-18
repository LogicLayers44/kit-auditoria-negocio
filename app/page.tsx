"use client";

import { useState, useRef } from "react";

type Status = "idle" | "loading" | "done" | "error";

const FIELDS = [
  { name: "web",          label: "URL de tu web",         placeholder: "https://tudominio.com",                      icon: "🌐", span: 2, required: false },
  { name: "redes",        label: "Redes sociales",         placeholder: "@tuhandle — Instagram, TikTok, LinkedIn...", icon: "📱", span: 2, required: false },
  { name: "producto",     label: "¿Qué vendes?",           placeholder: "Consultoría, cursos, productos...",          icon: "🛍️", span: 2, required: true  },
  { name: "precio",       label: "Precios",                placeholder: "Desde 97€, suscripción 29€/mes...",          icon: "💰", span: 1, required: false },
  { name: "cliente",      label: "Cliente ideal",          placeholder: "Emprendedores, pymes...",                    icon: "👤", span: 1, required: false },
  { name: "objetivo",     label: "Objetivo principal",     placeholder: "Más ventas, más leads...",                   icon: "🎯", span: 1, required: false },
  { name: "competidores", label: "Competidores (URLs)",    placeholder: "https://competidor.com",                     icon: "⚔️", span: 1, required: false },
  { name: "canales",      label: "Canales de venta",       placeholder: "Web, Instagram, email, ads...",              icon: "📣", span: 2, required: false },
  { name: "problemas",    label: "¿Qué crees que falla?", placeholder: "Nadie compra en la web...",                   icon: "⚠️", span: 2, required: false, textarea: true },
];

export default function Home() {
  const [form, setForm]           = useState<Record<string, string>>({});
  const [status, setStatus]       = useState<Status>("idle");
  const [reportHtml, setReport]   = useState("");
  const [charCount, setCharCount] = useState(0);
  const [error, setError]         = useState("");
  const abortRef                  = useRef<AbortController | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.producto?.trim()) return;
    setStatus("loading"); setReport(""); setCharCount(0); setError("");
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setCharCount(acc.length);
      }
      const match = acc.match(/<!DOCTYPE html[\s\S]*/i) ?? acc.match(/<html[\s\S]*/i);
      setReport(match ? match[0] : acc);
      setStatus("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") { setStatus("idle"); return; }
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  }

  function handleDownload() {
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    const domain = form.web
      ? (() => { try { return new URL(form.web.startsWith("http") ? form.web : `https://${form.web}`).hostname; } catch { return "negocio"; } })()
      : "negocio";
    a.download = `auditoria-${domain}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    abortRef.current?.abort();
    setStatus("idle"); setReport(""); setCharCount(0); setError("");
  }

  if (status === "done" && reportHtml) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#080d1a" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", gap: "12px", flexShrink: 0,
          background: "rgba(8,13,26,0.92)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(168,85,247,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LogoIcon size={24} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#f8fafc", letterSpacing: "-0.01em" }}>
              LogicLayers
            </span>
            <span style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Auditoría completada</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleDownload} style={chipBtn("#7c3aed", "#4f46e5")}>↓ Descargar HTML</button>
            <button onClick={handleReset}    style={chipBtn("#1a2235", "#1e2d47")}>← Nueva auditoría</button>
          </div>
        </div>
        <iframe srcDoc={reportHtml} style={{ flex: 1, border: "none", width: "100%" }}
          title="Informe de auditoría" sandbox="allow-scripts allow-same-origin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#080d1a" }}>

      {/* Dot grid texture */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(circle, rgba(168,85,247,0.18) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 100%)",
      }} />

      {/* Top glow */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "400px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.22) 0%, transparent 70%)",
      }} />

      {/* Subtle side orbs */}
      <div style={{
        position: "fixed", width: "500px", height: "500px", borderRadius: "50%",
        top: "-150px", right: "-150px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)",
        animation: "orb 14s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", width: "350px", height: "350px", borderRadius: "50%",
        bottom: "-80px", left: "-80px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
        animation: "orb 18s ease-in-out infinite reverse",
      }} />

      {/* Navbar */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px",
        borderBottom: "1px solid rgba(168,85,247,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LogoIcon size={28} />
          <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.02em", color: "#f8fafc" }}>
            LogicLayers
          </span>
        </div>
        <span style={{
          fontSize: "12px", color: "#3d5278", fontWeight: 500, letterSpacing: "0.04em",
        }}>
          Auditoría Digital · IA
        </span>
      </nav>

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "52px 20px 80px",
      }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: "680px" }}>

          {/* Logo hero */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ animation: "layerFloat 4s ease-in-out infinite", marginBottom: "20px" }}>
              <LogoIcon size={64} glow />
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 14px", borderRadius: "100px",
              background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)",
              fontSize: "12px", fontWeight: 500, color: "#c084fc", letterSpacing: "0.03em",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
              Powered by Claude AI
            </div>
          </div>

          {/* Heading */}
          <h1 style={{
            textAlign: "center", fontWeight: 800, lineHeight: 1.1,
            fontSize: "clamp(30px, 5vw, 50px)", marginBottom: "14px", letterSpacing: "-0.025em",
            background: "linear-gradient(135deg, #f8fafc 25%, #c084fc 65%, #818cf8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Auditoría de Negocio Digital
          </h1>

          <p style={{
            textAlign: "center", color: "#4a6080", fontSize: "15px",
            lineHeight: "1.65", maxWidth: "460px", margin: "0 auto 44px",
          }}>
            Analizo tu web, redes sociales, oferta y embudo de ventas.
            Te digo exactamente qué falla y cómo arreglarlo.
          </p>

          {/* Card */}
          <div style={{
            background: "rgba(12,18,36,0.7)", border: "1px solid rgba(168,85,247,0.12)",
            borderRadius: "20px", padding: "36px", backdropFilter: "blur(24px)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.06) inset, 0 1px 0 rgba(255,255,255,0.05) inset",
          }}>
            {status === "loading" ? (
              <LoadingView charCount={charCount} onCancel={handleReset} />
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "22px" }}>
                  {FIELDS.map(({ name, label, placeholder, icon, span, required, textarea }) => (
                    <div key={name} style={{ gridColumn: `span ${span}` }}>
                      <label style={{
                        display: "block", fontSize: "11px", fontWeight: 600,
                        color: "#4a6080", marginBottom: "7px", letterSpacing: "0.06em", textTransform: "uppercase",
                      }}>
                        {icon} {label}
                        {required && <span style={{ color: "#f43f5e", marginLeft: "3px" }}>*</span>}
                      </label>
                      {textarea ? (
                        <textarea name={name} placeholder={placeholder} value={form[name] ?? ""}
                          onChange={handleChange} rows={3} style={inputCss} />
                      ) : (
                        <input type="text" name={name} placeholder={placeholder} required={required}
                          value={form[name] ?? ""} onChange={handleChange} style={inputCss} />
                      )}
                    </div>
                  ))}
                </div>

                {status === "error" && (
                  <div style={{
                    padding: "12px 16px", marginBottom: "18px",
                    background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)",
                    borderRadius: "10px", color: "#fda4af", fontSize: "14px",
                  }}>{error}</div>
                )}

                <button type="submit" style={{
                  width: "100%", padding: "15px", border: "none", borderRadius: "12px",
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 45%, #4f46e5 100%)",
                  color: "#fff", fontWeight: 700, fontSize: "15px", cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  letterSpacing: "0.01em", transition: "all 0.2s ease",
                }}>
                  Auditar mi negocio →
                </button>

                <p style={{ textAlign: "center", marginTop: "13px", fontSize: "12px", color: "#253348" }}>
                  Investigación real con IA · El análisis tarda 2–4 minutos
                </p>
              </form>
            )}
          </div>

          {/* Feature pills */}
          {status !== "loading" && (
            <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginTop: "28px", flexWrap: "wrap" }}>
              {["Web & UX", "Redes sociales", "Meta Ads", "Copy", "Embudo de ventas", "Competencia"].map(tag => (
                <span key={tag} style={{ fontSize: "12px", color: "#2d3d5a", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ color: "#7c3aed" }}>✓</span> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── LogicLayers SVG icon ── */
function LogoIcon({ size = 32, glow = false }: { size?: number; glow?: boolean }) {
  const id = glow ? "g-glow" : "g-plain";
  return (
    <svg width={size} height={size} viewBox="0 0 60 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={`${id}-2`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${id}-3`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        {glow && (
          <filter id="glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      {/* Bottom layer */}
      <polygon points="30,39 56,50 30,55 4,50" fill={`url(#${id}-3)`} opacity="0.85" />
      {/* Middle layer */}
      <polygon points="30,24 56,35 30,40 4,35" fill={`url(#${id}-2)`} opacity="0.92" />
      {/* Top layer */}
      <polygon points="30,9 56,20 30,25 4,20" fill={`url(#${id}-1)`}
        filter={glow ? "url(#glow-filter)" : undefined} />
    </svg>
  );
}

/* ── Loading view ── */
function LoadingView({ charCount, onCancel }: { charCount: number; onCancel: () => void }) {
  const phases = [
    { threshold: 0,     text: "Iniciando investigación..." },
    { threshold: 1000,  text: "Analizando tu web y propuesta de valor..." },
    { threshold: 6000,  text: "Revisando redes sociales y engagement..." },
    { threshold: 15000, text: "Buscando anuncios activos en Meta Ads..." },
    { threshold: 28000, text: "Consultando Google Business y reseñas..." },
    { threshold: 45000, text: "Detectando incoherencias y errores..." },
    { threshold: 65000, text: "Generando el informe HTML..." },
  ];
  const phase    = [...phases].reverse().find(p => charCount >= p.threshold) ?? phases[0];
  const progress = Math.min((charCount / 80000) * 100, 95);

  const steps = [
    { label: "Análisis web y UX",          done: charCount > 1000  },
    { label: "Redes sociales y contenido",  done: charCount > 6000  },
    { label: "Meta Ads y publicidad",       done: charCount > 15000 },
    { label: "Google Business",             done: charCount > 28000 },
    { label: "Copy y coherencia de marca",  done: charCount > 45000 },
    { label: "Generando informe HTML",      done: charCount > 65000 },
  ];

  return (
    <div style={{ padding: "16px 0 8px", textAlign: "center" }}>
      <div style={{ position: "relative", width: "72px", height: "72px", margin: "0 auto 24px" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          animation: "pulse 2s ease-in-out infinite",
          boxShadow: "0 0 36px rgba(124,58,237,0.55)",
        }} />
        <div style={{
          position: "absolute", inset: "3px", borderRadius: "50%",
          background: "#080d1a", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LogoIcon size={36} />
        </div>
      </div>

      <p style={{ fontWeight: 600, fontSize: "17px", color: "#f1f5f9", marginBottom: "6px" }}>{phase.text}</p>
      <p style={{ fontSize: "13px", color: "#2d3d5a", marginBottom: "24px" }}>
        {charCount > 0 ? `${(charCount / 1000).toFixed(1)}k caracteres analizados` : "Contactando con Claude AI..."}
      </p>

      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{
          height: "100%", borderRadius: "2px", transition: "width 1.2s ease",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #7c3aed, #818cf8)",
          boxShadow: "0 0 10px rgba(124,58,237,0.7)",
        }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "24px", textAlign: "left" }}>
        {steps.map(({ label, done }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "17px", height: "17px", borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 700, transition: "all 0.4s ease",
              background: done ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${done ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.06)"}`,
              color: done ? "#a78bfa" : "#1e2d47",
            }}>
              {done ? "✓" : "·"}
            </span>
            <span style={{ fontSize: "13px", color: done ? "#7c94b8" : "#1e2d47", transition: "color 0.4s ease" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <button onClick={onCancel} style={{
        padding: "8px 20px", background: "transparent",
        border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px",
        color: "#2d3d5a", fontSize: "13px", cursor: "pointer",
      }}>
        Cancelar
      </button>
    </div>
  );
}

/* ── Shared styles ── */
const inputCss: React.CSSProperties = {
  width: "100%", padding: "10px 13px",
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)",
  borderRadius: "9px", color: "#e2e8f0", fontSize: "14px",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function chipBtn(from: string, to: string): React.CSSProperties {
  return {
    padding: "7px 15px", border: "none", borderRadius: "8px", cursor: "pointer",
    background: `linear-gradient(135deg, ${from}, ${to})`,
    color: "#fff", fontWeight: 600, fontSize: "13px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
  };
}
