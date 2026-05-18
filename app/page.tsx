"use client";

import { useState, useRef } from "react";

type Status = "idle" | "loading" | "done" | "error";

const FIELDS = [
  { name: "web",          label: "URL de tu web",          placeholder: "https://tudominio.com",                      icon: "🌐", span: 2, required: false },
  { name: "redes",        label: "Redes sociales",          placeholder: "@tuhandle — Instagram, TikTok, LinkedIn...", icon: "📱", span: 2, required: false },
  { name: "producto",     label: "¿Qué vendes?",            placeholder: "Consultoría de marketing, cursos, ropa...",  icon: "🛍️", span: 2, required: true  },
  { name: "precio",       label: "Precios",                 placeholder: "Desde 97€, suscripción 29€/mes...",          icon: "💰", span: 1, required: false },
  { name: "cliente",      label: "Cliente ideal",           placeholder: "Emprendedores, pymes...",                    icon: "👤", span: 1, required: false },
  { name: "objetivo",     label: "Objetivo principal",      placeholder: "Más ventas, más leads, nuevo lanzamiento...",icon: "🎯", span: 1, required: false },
  { name: "competidores", label: "Competidores (URLs)",     placeholder: "https://competidor.com",                     icon: "⚔️", span: 1, required: false },
  { name: "canales",      label: "Canales de venta",        placeholder: "Web, Instagram, email, ads...",              icon: "📣", span: 2, required: false },
  { name: "problemas",    label: "¿Qué crees que falla?",  placeholder: "Nadie compra en la web, bajo engagement...", icon: "⚠️", span: 2, required: false, textarea: true },
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
      const reader  = res.body!.getReader();
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
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#030712" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", gap: "12px", flexShrink: 0,
          background: "rgba(3,7,18,0.9)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#22c55e", boxShadow: "0 0 8px #22c55e",
            }} />
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#f8fafc" }}>
              Auditoría completada
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleDownload} style={chipBtn("#7c3aed", "#4f46e5")}>
              ↓ Descargar HTML
            </button>
            <button onClick={handleReset} style={chipBtn("#1e293b", "#334155")}>
              ← Nueva auditoría
            </button>
          </div>
        </div>
        <iframe
          srcDoc={reportHtml}
          style={{ flex: 1, border: "none", width: "100%" }}
          title="Informe de auditoría"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "fixed", width: "600px", height: "600px", borderRadius: "50%", pointerEvents: "none",
        top: "-200px", right: "-200px", zIndex: 0,
        background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
        animation: "orb 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", width: "400px", height: "400px", borderRadius: "50%", pointerEvents: "none",
        bottom: "-100px", left: "-100px", zIndex: 0,
        background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)",
        animation: "orb 16s ease-in-out infinite reverse",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "60px 20px 80px",
      }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: "680px" }}>

          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 14px", borderRadius: "100px",
              background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
              fontSize: "12px", fontWeight: 500, color: "#a78bfa", letterSpacing: "0.02em",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
              Powered by Claude AI
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            textAlign: "center", fontWeight: 800, lineHeight: 1.1,
            fontSize: "clamp(32px, 5vw, 52px)", marginBottom: "16px", letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #f8fafc 30%, #a78bfa 70%, #60a5fa 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Auditoría de Negocio Digital
          </h1>

          <p style={{
            textAlign: "center", color: "#64748b", fontSize: "16px",
            lineHeight: "1.6", marginBottom: "48px", maxWidth: "480px", margin: "0 auto 48px",
          }}>
            Analizo tu web, redes sociales, oferta, precios y embudo de ventas.
            Te digo exactamente qué está fallando y cómo arreglarlo.
          </p>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px", padding: "36px", backdropFilter: "blur(20px)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
            {status === "loading" ? (
              <LoadingView charCount={charCount} onCancel={handleReset} />
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px",
                }}>
                  {FIELDS.map(({ name, label, placeholder, icon, span, required, textarea }) => (
                    <div key={name} style={{ gridColumn: `span ${span}` }}>
                      <label style={{
                        display: "block", fontSize: "12px", fontWeight: 500,
                        color: "#94a3b8", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>
                        {icon} {label}
                        {required && <span style={{ color: "#f43f5e", marginLeft: "4px" }}>*</span>}
                      </label>
                      {textarea ? (
                        <textarea
                          name={name} placeholder={placeholder} value={form[name] ?? ""}
                          onChange={handleChange} rows={3} style={inputCss}
                        />
                      ) : (
                        <input
                          type="text" name={name} placeholder={placeholder}
                          value={form[name] ?? ""} onChange={handleChange}
                          required={required} style={inputCss}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {status === "error" && (
                  <div style={{
                    padding: "12px 16px", marginBottom: "20px",
                    background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)",
                    borderRadius: "10px", color: "#fda4af", fontSize: "14px",
                  }}>
                    {error}
                  </div>
                )}

                <button type="submit" style={{
                  width: "100%", padding: "15px", border: "none", borderRadius: "12px",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
                  color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                  letterSpacing: "0.01em", transition: "all 0.2s ease",
                }}>
                  Auditar mi negocio →
                </button>

                <p style={{
                  textAlign: "center", marginTop: "14px",
                  fontSize: "12px", color: "#334155",
                }}>
                  Investigación real con IA · El análisis tarda 2-4 minutos
                </p>
              </form>
            )}
          </div>

          {/* Footer pills */}
          {status !== "loading" && (
            <div style={{
              display: "flex", justifyContent: "center", gap: "20px",
              marginTop: "32px", flexWrap: "wrap",
            }}>
              {["Web & UX", "Redes sociales", "Meta Ads", "Copy", "Embudo de ventas", "Competencia"].map(tag => (
                <span key={tag} style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
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
  const phase = [...phases].reverse().find(p => charCount >= p.threshold) ?? phases[0];
  const progress = Math.min((charCount / 80000) * 100, 95);

  return (
    <div style={{ padding: "20px 0 10px", textAlign: "center" }}>
      {/* Pulsing orb */}
      <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 28px" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          animation: "pulse 2s ease-in-out infinite",
          boxShadow: "0 0 40px rgba(124,58,237,0.5)",
        }} />
        <div style={{
          position: "absolute", inset: "3px", borderRadius: "50%", background: "#0f172a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "28px",
        }}>
          🔍
        </div>
      </div>

      <p style={{ fontWeight: 600, fontSize: "18px", color: "#f8fafc", marginBottom: "8px" }}>
        {phase.text}
      </p>
      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "28px" }}>
        {charCount > 0 ? `${(charCount / 1000).toFixed(1)}k caracteres analizados` : "Contactando con Claude AI..."}
      </p>

      {/* Progress bar */}
      <div style={{
        height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px",
        overflow: "hidden", marginBottom: "28px",
      }}>
        <div style={{
          height: "100%", borderRadius: "2px", transition: "width 1s ease",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #7c3aed, #2563eb)",
          boxShadow: "0 0 12px rgba(124,58,237,0.6)",
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px", textAlign: "left" }}>
        {[
          { label: "Análisis web y UX",         done: charCount > 1000  },
          { label: "Redes sociales y contenido", done: charCount > 6000  },
          { label: "Meta Ads y publicidad",      done: charCount > 15000 },
          { label: "Google Business",            done: charCount > 28000 },
          { label: "Copy y coherencia de marca", done: charCount > 45000 },
          { label: "Informe HTML",               done: charCount > 65000 },
        ].map(({ label, done }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700,
              background: done ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${done ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
              color: done ? "#a78bfa" : "#334155",
              transition: "all 0.4s ease",
            }}>
              {done ? "✓" : "·"}
            </span>
            <span style={{ fontSize: "13px", color: done ? "#94a3b8" : "#334155", transition: "color 0.4s ease" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <button onClick={onCancel} style={{
        padding: "9px 20px", background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
        color: "#475569", fontSize: "13px", cursor: "pointer",
      }}>
        Cancelar
      </button>
    </div>
  );
}

const inputCss: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px", color: "#f1f5f9", fontSize: "14px",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function chipBtn(from: string, to: string): React.CSSProperties {
  return {
    padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer",
    background: `linear-gradient(135deg, ${from}, ${to})`,
    color: "#fff", fontWeight: 600, fontSize: "13px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  };
}
