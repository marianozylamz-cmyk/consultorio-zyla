import type { Metadata } from "next";
import "./globals.css";

const titulo = "Dr. Juan Manuel Zyla — Consultorio Online";
const descripcion =
  "Consultas médicas online con el Dr. Juan Manuel Zyla, médico especialista en Clínica Médica en Olavarría, Buenos Aires.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: titulo,
  description: descripcion,
  openGraph: {
    title: titulo,
    description: descripcion,
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: titulo,
    description: descripcion,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
