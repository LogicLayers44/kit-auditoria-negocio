"use client";

import { useState, useRef } from "react";

type Status = "idle" | "loading" | "done" | "error";

const FIELDS = [
  { name: "web", label: "URL de tu web", placeholder: "https://tudominio.com", required: false },
  { name: "redes", label: "Redes sociales", placeholder: "@tuhandle en Instagram, TikTok, LinkedIn...", required: false },
  { name: "producto", label: "¿Qué vendes?", placeholder: "Consultoría de marketing, cursos online, ropa...", required: true },
  { name: "precio", label: "Precios", placeholder: "Desde 97€, suscripción mensual de 29€...", required: false },
  { name: "cliente", label: "Cliente ideal", placeholder: "Emprendedores, pymes, madres trabajadoras...", required: false },
  { name: "objetivo", label: "Objetivo principal ahora", placeholder: "Más ventas, más leads, lanzar algo nuevo...", required: false },
  { name: "competidores", label: "Competidores directos (URLs)", placeholder: "https://competidor.com", required: false },
  { name: "canales", label: "Canales de venta", placeholder: "Web, Instagram, email marketing, ads...", required: false },
  { name: "problemas", label: "¿Qué crees que no funciona?", placeholder: "Nadie compra en la web, bajo engagement...", required: false },
];

export default function Home() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [reportHtml, setReportHtml] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.producto?.trim()) return;

    setStatus("loading");
    setReportHtml("");
    setCharCount(0);
    setError("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setCharCount(accumulated.length);
      }

      const htmlMatch = accumulated.match(/<!DOCTYPE html[\s\S]*/i) || accumulated.match(/<html[\s\S]*/i);
      setReportHtml(htmlMatch ? htmlMatch[0] : accumulated);
      setStatus("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStatus("error");
    }
  }

  function handleDownload() {
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const domain = form.web ? new URL(form.web.startsWith("http") ? form.web : `https://${form.web}`).hostname : "negocio";
    a.download = `auditoria-${domain}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    abortRef.current?.abort();
    setStatus("idle");
    setReportHtml("");
    setCharCount(0);
    setError("");
  }

  if (status === "done" && reportHtml) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", background: "#1a1a1a", borderBottom: "1px solid #333",
          gap: "12px", flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, color: "#f0f0f0" }}>Auditoría completada</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleDownload} style={btnStyle("#2563eb")}>
              Descargar HTML
            </button>
            <button onClick={handleReset} style={btnStyle("#374151")}>
              Nueva auditoría
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
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", color: "#f0f0f0" }}>
          Auditoría de Negocio Digital
        </h1>
        <p style={{ color: "#888", marginBottom: "32px", lineHeight: "1.5" }}>
          Analizo tu web, redes sociales, oferta, precios, embudo de ventas y coherencia de marca.
          Te genero un informe con errores, incoherencias y plan de acción.
        </p>

        {status === "loading" ? (
          <LoadingView charCount={charCount} onCancel={handleReset} />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {FIELDS.map(({ name, label, placeholder, required }) => (
              <div key={name}>
                <label style={{ display: "block", fontSize: "13px", color: "#aaa", marginBottom: "6px" }}>
                  {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                {name === "problemas" ? (
                  <textarea
                    name={name}
                    placeholder={placeholder}
                    value={form[name] || ""}
                    onChange={handleChange}
                    rows={3}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type="text"
                    name={name}
                    placeholder={placeholder}
                    value={form[name] || ""}
                    onChange={handleChange}
                    required={required}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}

            {status === "error" && (
              <div style={{ padding: "12px", background: "#1f0909", border: "1px solid #7f1d1d", borderRadius: "8px", color: "#fca5a5", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button type="submit" style={{ ...btnStyle("#2563eb"), padding: "14px", fontSize: "16px", marginTop: "8px" }}>
              Auditar mi negocio
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function LoadingView({ charCount, onCancel }: { charCount: number; onCancel: () => void }) {
  const phases = [
    { threshold: 0, text: "Analizando tu negocio..." },
    { threshold: 2000, text: "Investigando tu web y redes sociales..." },
    { threshold: 8000, text: "Revisando anuncios y Google Business..." },
    { threshold: 20000, text: "Analizando oferta, precios y copy..." },
    { threshold: 40000, text: "Detectando incoherencias y errores..." },
    { threshold: 60000, text: "Generando el informe HTML..." },
  ];
  const phase = [...phases].reverse().find((p) => charCount >= p.threshold) ?? phases[0];

  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <Spinner />
      <p style={{ color: "#f0f0f0", marginTop: "20px", fontSize: "16px" }}>{phase.text}</p>
      <p style={{ color: "#555", marginTop: "8px", fontSize: "13px" }}>
        {charCount > 0 ? `${(charCount / 1000).toFixed(1)}k caracteres generados` : "Iniciando investigación..."}
      </p>
      <button onClick={onCancel} style={{ ...btnStyle("#374151"), marginTop: "24px", fontSize: "13px" }}>
        Cancelar
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: "40px", height: "40px", border: "3px solid #333",
      borderTop: "3px solid #2563eb", borderRadius: "50%",
      animation: "spin 0.8s linear infinite", margin: "0 auto",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "#1a1a1a",
  border: "1px solid #333", borderRadius: "8px", color: "#f0f0f0",
  fontSize: "14px", outline: "none", resize: "vertical" as const,
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px",
    whiteSpace: "nowrap",
  };
}
