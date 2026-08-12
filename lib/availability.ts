import { AvailabilityConfig, Weekday } from "@/types";

// ==========================================================
// Disponibilidad
//
// Hay dos conceptos distintos:
//
// 1. AGENDA NORMAL
//    Surge de horarioSemanal + excepciones.
//    Define cuándo se pueden reservar turnos.
//
// 2. ATENCIÓN INMEDIATA (interruptor manual)
//    Surge de config.activo, PERO solo tiene efecto FUERA del
//    horario fijo de hoy. Es para situaciones excepcionales:
//    el médico tiene unos minutos libres fuera de su horario
//    habitual y quiere aparecer disponible por si alguien llama.
//
//    Si estamos DENTRO del horario fijo (ej: martes 17 a 19),
//    ya está cubierto por la agenda normal — el interruptor
//    manual no aplica y se ignora.
//
// Todo se calcula en horario de Argentina.
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
  fecha: string;
  minutosDelDia: number;
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
    if (p.type !== "literal") {
      partes[p.type] = p.value;
    }
  }

  const hora = Number(partes.hour) % 24;

  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutosDelDia: hora * 60 + Number(partes.minute),
    weekday: WEEKDAY_MAP[partes.weekday],
  };
}

export function weekdayFromDate(date: Date): Weekday {
  return partesEnArgentina(date).weekday;
}

/** Fecha YYYY-MM-DD según el calendario argentino. */
export function toISODate(date: Date): string {
  return partesEnArgentina(date).fecha;
}

/**
 * Construye un Date a partir de YYYY-MM-DD interpretado
 * al mediodía de Argentina.
 */
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

/**
 * Devuelve el horario NORMAL efectivo para una fecha.
 *
 * Esto contempla:
 * - horario semanal
 * - excepciones puntuales
 *
 * IMPORTANTE:
 * Esto NO mira config.activo.
 *
 * Por lo tanto, apagar "disponibilidad ahora" NO elimina
 * los turnos normales.
 */
export function getEffectiveScheduleForDate(
  config: AvailabilityConfig,
  date: Date
) {
  const iso = toISODate(date);
  const weekday = weekdayFromDate(date);
  const base = config.horarioSemanal[weekday];

  const override = config.excepciones.find((e) => e.fecha === iso);

  if (override) {
    if (override.cerrado) {
      return {
        habilitado: false,
        inicio: null,
        fin: null,
      };
    }

    return {
      habilitado: true,
      inicio: override.inicio ?? base.inicio,
      fin: override.fin ?? base.fin,
    };
  }

  return {
    habilitado: base.habilitado,
    inicio: base.inicio,
    fin: base.fin,
  };
}

/**
 * ¿La hora actual cae dentro del horario FIJO de hoy
 * (horarioSemanal + excepciones)?
 *
 * Se usa para decidir si el interruptor manual (config.activo)
 * tiene algún efecto o no: dentro del horario fijo, la agenda
 * normal ya cubre la disponibilidad, así que el interruptor
 * queda fuera de juego.
 */
export function estaDentroDelHorarioHabitual(
  config: AvailabilityConfig,
  now: Date = new Date()
): boolean {
  const schedule = getEffectiveScheduleForDate(config, now);

  if (!schedule.habilitado || !schedule.inicio || !schedule.fin) {
    return false;
  }

  const nowMins = partesEnArgentina(now).minutosDelDia;
  const startMins = timeToMinutes(schedule.inicio);
  const endMins = timeToMinutes(schedule.fin);

  return nowMins >= startMins && nowMins < endMins;
}

/**
 * Estado de ATENCIÓN INMEDIATA.
 *
 * Regla:
 *
 * - Si estamos DENTRO del horario fijo de hoy, ya está cubierto
 *   por la agenda normal: disponible = true siempre, sin importar
 *   config.activo. El interruptor manual no tiene efecto acá.
 *
 * - Si estamos FUERA del horario fijo de hoy, ahí sí decide
 *   config.activo: es el interruptor pensado para que el médico
 *   avise que atiende por fuera de su horario habitual.
 */
export function isAvailableNow(
  config: AvailabilityConfig,
  now: Date = new Date()
): {
  disponible: boolean;
  horarioHoy: null;
  dentroDeHorarioHabitual: boolean;
} {
  const dentro = estaDentroDelHorarioHabitual(config, now);

  if (dentro) {
    return {
      disponible: true,
      horarioHoy: null,
      dentroDeHorarioHabitual: true,
    };
  }

  return {
    disponible: config.activo,
    horarioHoy: null,
    dentroDeHorarioHabitual: false,
  };
}

/**
 * Genera los turnos normales de una fecha.
 *
 * Los turnos:
 * - respetan horarioSemanal
 * - respetan excepciones
 * - son cada 30 minutos
 * - si es hoy, elimina horarios que ya pasaron
 *
 * IMPORTANTE:
 * config.activo NO participa.
 *
 * Aunque el médico no esté atendiendo AHORA, los turnos
 * normales siguen disponibles.
 */
export function getSlotsForDate(
  config: AvailabilityConfig,
  date: Date,
  intervalMinutes = 30
): string[] {
  const schedule = getEffectiveScheduleForDate(config, date);

  if (!schedule.habilitado || !schedule.inicio || !schedule.fin) {
    return [];
  }

  const startMins = timeToMinutes(schedule.inicio);
  const endMins = timeToMinutes(schedule.fin);

  const now = new Date();

  const isToday = toISODate(date) === toISODate(now);

  const nowMins = partesEnArgentina(now).minutosDelDia;

  const slots: string[] = [];

  for (let t = startMins; t < endMins; t += intervalMinutes) {
    // Si es hoy, no mostrar turnos que ya pasaron.
    if (isToday && t <= nowMins) {
      continue;
    }

    slots.push(minutesToTime(t));
  }

  return slots;
}