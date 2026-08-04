import { AvailabilityConfig, Weekday } from "@/types";

// ==========================================================
// Todo el cálculo de disponibilidad pasa por acá, y TODO usa
// explícitamente la zona horaria de Argentina
// (America/Argentina/Buenos_Aires, UTC-3 fijo, sin horario de
// verano desde 2009). Esto es a propósito: si dependiéramos de
// `date.getHours()` / `date.getDay()` directo, el resultado
// cambia según en qué timezone esté configurado el servidor
// donde corra Node (en local puede coincidir con Argentina "de
// casualidad", pero en un hosting real como Vercel el proceso
// corre en UTC por defecto) — y ahí "17:00 a 19:00" deja de
// significar lo mismo para el paciente que para el servidor.
// Usamos Intl.DateTimeFormat con timeZone fijo para que el
// resultado sea siempre el mismo sin importar dónde se ejecute.
// ==========================================================

const TIMEZONE = "America/Argentina/Buenos_Aires";
const WEEKDAY_MAP: Record<string, Weekday> = {
  Sun: "dom",
  Mon: "lun",
  Tue: "mar",
  Wed: "mie",
  Thu: "jue",
  Fri: "vie",
  Sat: "sab",
};

interface PartesFechaAR {
  fecha: string; // "YYYY-MM-DD" en calendario de Argentina
  minutosDelDia: number; // hora*60+minuto, en horario de Argentina
  weekday: Weekday;
}

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

function partesEnArgentina(date: Date): PartesFechaAR {
  const partes: Record<string, string> = {};
  for (const p of formatter.formatToParts(date)) {
    if (p.type !== "literal") partes[p.type] = p.value;
  }
  const hora = Number(partes.hour) % 24; // hourCycle h23 puede devolver "24" a medianoche en algunos motores
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutosDelDia: hora * 60 + Number(partes.minute),
    weekday: WEEKDAY_MAP[partes.weekday],
  };
}

export function weekdayFromDate(date: Date): Weekday {
  return partesEnArgentina(date).weekday;
}

/** Fecha en formato "YYYY-MM-DD" según el calendario de Argentina (no UTC). */
export function toISODate(date: Date): string {
  return partesEnArgentina(date).fecha;
}

/** Construye un Date a partir de un string "YYYY-MM-DD" interpretado como mediodía en Argentina (evita saltos de día por huso horario). */
export function fechaDesdeISO(iso: string): Date {
  return new Date(`${iso}T12:00:00-03:00`);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Devuelve el horario efectivo (inicio/fin/habilitado) para una fecha dada, contemplando excepciones puntuales. */
export function getEffectiveScheduleForDate(config: AvailabilityConfig, date: Date) {
  const iso = toISODate(date);
  const override = config.excepciones.find((e) => e.fecha === iso);
  if (override) {
    if (override.cerrado) {
      return { habilitado: false, inicio: null, fin: null };
    }
    return {
      habilitado: true,
      inicio: override.inicio ?? config.horarioSemanal[weekdayFromDate(date)].inicio,
      fin: override.fin ?? config.horarioSemanal[weekdayFromDate(date)].fin,
    };
  }
  const base = config.horarioSemanal[weekdayFromDate(date)];
  return { habilitado: base.habilitado, inicio: base.inicio, fin: base.fin };
}

/** Estado actual en vivo: si el master switch está activo y estamos dentro del horario de hoy (hora de Argentina). */
export function isAvailableNow(config: AvailabilityConfig, now: Date = new Date()) {
  if (!config.activo) return { disponible: false, horarioHoy: null as null | { inicio: string; fin: string } };
  const schedule = getEffectiveScheduleForDate(config, now);
  if (!schedule.habilitado || !schedule.inicio || !schedule.fin) {
    return { disponible: false, horarioHoy: null };
  }
  const nowMins = partesEnArgentina(now).minutosDelDia;
  const dentroDeHorario =
    nowMins >= timeToMinutes(schedule.inicio) && nowMins < timeToMinutes(schedule.fin);
  return {
    disponible: dentroDeHorario,
    horarioHoy: { inicio: schedule.inicio, fin: schedule.fin },
  };
}

/** Genera turnos cada 30 minutos dentro del horario habilitado de una fecha, excluyendo horarios ya pasados si es hoy (hora de Argentina). */
export function getSlotsForDate(
  config: AvailabilityConfig,
  date: Date,
  intervalMinutes = 30
): string[] {
  const schedule = getEffectiveScheduleForDate(config, date);
  if (!schedule.habilitado || !schedule.inicio || !schedule.fin) return [];

  const startMins = timeToMinutes(schedule.inicio);
  const endMins = timeToMinutes(schedule.fin);
  const now = new Date();
  const isToday = toISODate(date) === toISODate(now);
  const nowMins = partesEnArgentina(now).minutosDelDia;

  const slots: string[] = [];
  for (let t = startMins; t < endMins; t += intervalMinutes) {
    if (isToday && t <= nowMins) continue;
    slots.push(minutesToTime(t));
  }
  return slots;
}
