import { TipoConsultaId } from "@/types";

const CLAVE = "misConsultas";

export interface ConsultaGuardada {
  id: string;
  fecha: string;
  hora: string;
  tipoConsulta: TipoConsultaId;
}

// ==========================================================
// Seguimiento de "mi consulta" en este navegador, sin cuentas ni
// login: guardamos acá el id de cada consulta que se creó desde
// este dispositivo, más lo mínimo para pintar un resumen sin
// esperar al servidor (fecha, hora, tipo). Nunca datos del
// paciente (DNI, mail, WhatsApp) — el estado real y todo lo demás
// siempre se confirma en vivo contra el servidor.
//
// Si el paciente borra los datos del navegador, cambia de
// dispositivo o usa modo incógnito, se pierde el seguimiento — es
// la limitación esperada de no tener cuentas, no hace falta
// resolverla.
// ==========================================================

function leer(): ConsultaGuardada[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CLAVE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function escribir(consultas: ConsultaGuardada[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(consultas));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — no es crítico, solo se pierde el seguimiento.
  }
}

export function leerMisConsultas(): ConsultaGuardada[] {
  return leer();
}

export function agregarMiConsulta(consulta: ConsultaGuardada): void {
  const actuales = leer().filter((c) => c.id !== consulta.id);
  escribir([...actuales, consulta]);
}

export function quitarMiConsulta(id: string): void {
  escribir(leer().filter((c) => c.id !== id));
}
