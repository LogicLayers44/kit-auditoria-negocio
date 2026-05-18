import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auditoría de Negocio Digital",
  description: "Analiza tu presencia digital completa: web, redes sociales, oferta, precios y embudo de ventas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
