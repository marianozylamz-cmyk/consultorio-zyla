import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ==========================================================
// Protección mínima real para /admin y las rutas de API que solo
// tiene sentido que llame el médico (nunca un paciente anónimo).
//
// HTTP Basic Auth, no un sistema de login propio: para un solo
// médico es standard, seguro sobre HTTPS, y no agrega ninguna
// pieza nueva de infraestructura (sin cookies, sin sesiones, sin
// tabla de usuarios). El único costo es un prompt nativo del
// navegador en vez de una pantalla de login con la marca del
// sitio — aceptable para este alcance.
//
// Requiere ADMIN_USERNAME y ADMIN_PASSWORD en el entorno. Si no
// están configuradas, esto FALLA CERRADO (bloquea todo) en vez de
// quedar abierto — hay que configurarlas antes de poder entrar a
// /admin. Ver env.example.
// ==========================================================

const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

function noAutorizado() {
  return new NextResponse("Autenticación requerida.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel del médico"' },
  });
}

function estaAutorizado(req: NextRequest): boolean {
  if (!ADMIN_USER || !ADMIN_PASS) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }

  const separador = decoded.indexOf(":");
  if (separador === -1) return false;

  const usuario = decoded.slice(0, separador);
  const clave = decoded.slice(separador + 1);
  return usuario === ADMIN_USER && clave === ADMIN_PASS;
}

/**
 * Decide si esta combinación path+method es exclusiva del médico.
 *
 * Todo lo que un paciente anónimo necesita (crear consulta, ver SU
 * propia consulta por id, pagar, consultar disponibilidad) queda
 * afuera a propósito — solo se protege lo que hoy únicamente llama
 * el panel de /admin.
 */
function esRutaDeMedico(pathname: string, method: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin/")) return true;

  if (pathname === "/api/consultations" && method === "GET") return true;

  const match = pathname.match(/^\/api\/consultations\/[^/]+(\/.*)?$/);
  if (match) {
    const resto = match[1] ?? "";
    if (resto === "" && method === "PATCH") return true;
    if (resto === "/documents" && method === "POST") return true;
    if (resto === "/certificado" && method === "POST") return true;
    if (resto === "/observaciones" && method === "POST") return true;
    if (resto === "/solicitud-estudios" && method === "POST") return true;
    if (resto === "/enviar-documentacion" && method === "POST") return true;
    if (resto === "/receta-externa" && method === "POST") return true;
    if (resto === "/receta-externa/enviar" && method === "POST") return true;
  }

  return false;
}

export function middleware(req: NextRequest) {
  if (esRutaDeMedico(req.nextUrl.pathname, req.method) && !estaAutorizado(req)) {
    return noAutorizado();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/consultations/:path*", "/api/admin/:path*"],
};
