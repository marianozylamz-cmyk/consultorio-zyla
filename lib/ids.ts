// ==========================================================
// Generador de IDs — no toca ninguna base de datos, así que vive
// separado de lib/store.ts (que es 100% acceso a datos).
//
// Usa crypto.randomUUID() (nativo, sin dependencias) y no
// Math.random(): el id de una consulta funciona como link privado
// de facto (GET /api/consultations/[id] no pide autenticación —
// es lo que usa el paciente para ver su propia sala de espera), así
// que tiene que ser realmente no adivinable. Math.random() no da
// esa garantía.
// ==========================================================

export function genId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
