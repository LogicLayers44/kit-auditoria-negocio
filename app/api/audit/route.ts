import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `Eres un auditor experto en negocios digitales. Tu trabajo es analizar exhaustivamente la presencia digital de un negocio y generar un informe HTML ejecutivo completo.

PROCESO DE AUDITORÍA:

1. USA web_fetch para analizar la web del negocio si te dan URL:
   - Primera impresión: ¿se entiende qué vende en 5 segundos? ¿El h1 y hero son claros?
   - Propuesta de valor: ¿diferenciada o genérica?
   - CTAs: ¿hay botones claros? ¿Cuántos clicks hasta comprar/contactar?
   - Precios: ¿visibles o hay que pedir presupuesto? ¿Incoherencias?
   - Testimonios y social proof
   - Captación de emails: busca Mailchimp, ConvertKit, ActiveCampaign, Brevo en el código
   - Chat/WhatsApp
   - Velocidad y técnico: HTTPS, responsive

2. USA web_search para investigar redes sociales:
   - Busca el negocio en Instagram, TikTok, LinkedIn, YouTube, Facebook
   - Analiza bio, link en bio, tipo de contenido, frecuencia, engagement
   - Coherencia visual y de tono entre redes y web

3. USA web_search para Meta Ads Library:
   - Busca: "facebook.com/ads/library" + nombre del negocio
   - Analiza anuncios activos: cuántos, desde cuándo, creativos, copy, coherencia con web

4. USA web_search para Google Business:
   - Busca el negocio en Google Maps
   - Analiza: ficha reclamada, fotos, reseñas, puntuación, si responde reseñas

5. ANALIZA el copy en todos los canales:
   - ¿Habla para el cliente o para sí mismo?
   - ¿CTAs genéricos o específicos?
   - ¿Tono coherente entre canales?
   - Ejemplos concretos con antes/después

6. DETECTA incoherencias:
   - Precio vs posicionamiento
   - Mensaje vs audiencia
   - Web vs redes (tono, oferta, precios)
   - Promesa vs evidencia

7. MAPEA el Customer Journey completo:
   - PRE-VENTA: Descubrimiento → Primera visita → Investigación → Consideración → Decisión
   - POST-VENTA: Onboarding, upsell, reseñas, fidelización, comunidad
   - ¿Dónde se pierden los clientes?

REGLA FUNDAMENTAL: Análisis honesto basado en datos reales. No suavices problemas ni exageres aciertos.

FORMATO DE SALIDA:
Genera ÚNICAMENTE un documento HTML completo y autocontenido (CSS y JS inline) con el informe de auditoría. Sin texto antes ni después del HTML. El documento debe comenzar con <!DOCTYPE html>.

El informe HTML debe incluir obligatoriamente:
1. Puntuación global (0-100) con desglose visual por área: Web/UX, SEO, Redes Sociales, Meta Ads, Copy, Oferta/Precios, Customer Journey, Google Business, Contenido, Reputación, Coherencia de Marca, Competencia (si aplica)
2. Resumen ejecutivo (3 párrafos): estado actual, problema principal, oportunidad
3. Incoherencias y errores detectados con: descripción, por qué es un problema, cómo corregirlo, prioridad (alta/media/baja)
4. Mapa visual del Customer Journey completo con indicación de dónde se pierden clientes
5. Análisis de Meta Ads (si tiene: cuántos, desde cuándo, coherencia; si no tiene: si debería)
6. Análisis del copy con ejemplos antes/después concretos
7. Estado de Google Business
8. Desglose por área: puntuación, qué está bien, qué está mal, acciones concretas
9. Plan de acción priorizado en tabla: Prioridad | Acción | Impacto | Esfuerzo | Área
10. Quick wins: 3-5 cosas que puede hacer esta semana con tiempo estimado
11. Comparativa con competencia en tabla (si se proporcionaron competidores)

Diseño del dashboard: responsive, autocontenido, imprimible, navegación interna con anclas. Tono profesional y directo — no como informe de consultoría genérico sino como si un experto te dijera la verdad.`;

interface FormData {
  web?: string;
  redes?: string;
  producto?: string;
  precio?: string;
  cliente?: string;
  objetivo?: string;
  competidores?: string;
  canales?: string;
  problemas?: string;
}

function buildUserMessage(data: FormData): string {
  const lines = ["Audita mi negocio digital con toda la información que te doy:"];
  if (data.web) lines.push(`Web: ${data.web}`);
  if (data.redes) lines.push(`Redes sociales: ${data.redes}`);
  if (data.producto) lines.push(`Qué vendo: ${data.producto}`);
  if (data.precio) lines.push(`Precios: ${data.precio}`);
  if (data.cliente) lines.push(`Cliente ideal: ${data.cliente}`);
  if (data.objetivo) lines.push(`Objetivo principal: ${data.objetivo}`);
  if (data.competidores) lines.push(`Competidores: ${data.competidores}`);
  if (data.canales) lines.push(`Canales de venta: ${data.canales}`);
  if (data.problemas) lines.push(`Lo que creo que no funciona: ${data.problemas}`);

  lines.push("\nInvestiga todo lo que puedas online y genera el informe HTML completo de la auditoría. Empieza investigando ahora.");
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const body: FormData = await request.json();

  if (!body.producto?.trim()) {
    return new Response("Debes indicar qué vendes", { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY no configurada", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const userMessage = buildUserMessage(body);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        type MessageParam = { role: "user" | "assistant"; content: Anthropic.MessageParam["content"] };
        let messages: MessageParam[] = [{ role: "user", content: userMessage }];

        for (let round = 0; round < 5; round++) {
          const stream = await client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 16000,
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages,
            tools: [
              { type: "web_search_20260209", name: "web_search" } as unknown as Anthropic.Tool,
              { type: "web_fetch_20260209", name: "web_fetch" } as unknown as Anthropic.Tool,
            ],
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          const finalMessage = await stream.finalMessage();
          if ((finalMessage.stop_reason as string) !== "pause_turn") break;

          messages = [
            { role: "user", content: userMessage },
            { role: "assistant", content: finalMessage.content },
          ];
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error interno";
        controller.enqueue(encoder.encode(`\n\nError: ${message}`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
