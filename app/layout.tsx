import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Juan Manuel Zyla — Consultorio Online",
  description:
    "Consultas médicas online con el Dr. Juan Manuel Zyla, médico especialista en Clínica Médica en Olavarría, Buenos Aires.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
