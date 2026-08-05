// ==========================================================
// Generadores de ID puros — no tocan ninguna base de datos, así
// que viven separados de lib/store.ts (que ahora es 100% acceso
// a datos vía Supabase). Separarlos evita que un archivo mezcle
// dos responsabilidades distintas.
// ==========================================================

export function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function genToken() {
  // token largo, no predecible, para usos como el id de sala de video
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
}
