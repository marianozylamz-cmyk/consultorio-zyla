/**
 * Decodifica el header "Authorization: Basic ..." de HTTP Basic Auth.
 * Un solo lugar para esto — lo usa middleware.ts (para validar
 * usuario+clave y dejar pasar la request) y las rutas de API que
 * necesitan saber QUIÉN hizo una acción para trazabilidad (ej. quién
 * marcó una consulta como pagada a mano). Ninguna ruta de API vuelve a
 * validar clave: si la request llegó hasta acá es porque middleware ya
 * la autorizó.
 */
export function decodificarBasicAuth(req: Request): { usuario: string; clave: string } | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return null;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return null;
  }

  const separador = decoded.indexOf(":");
  if (separador === -1) return null;

  return { usuario: decoded.slice(0, separador), clave: decoded.slice(separador + 1) };
}
