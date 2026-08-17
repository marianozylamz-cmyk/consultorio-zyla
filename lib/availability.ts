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
// 2. ATENCIÓN INMEDIATA (interruptor manual "Atender ahora")
//    Surge de config.activoDesde, PERO solo tiene efecto FUERA del
//    horario fijo de hoy. Pensado para casos especiales/urgencias:
//    el médico quiere atender fuera de su horario habitual (incluso
//    un día marcado como no laborable) por un rato puntual.
//
//    Si estamos DENTRO del horario fijo (ej: martes 17 a 19),
//    ya está cubierto por la agenda normal — el interruptor
//    manual no aplica y se ignora.
//
//    activoDesde guarda la fecha (ISO, Argentina) en que se activó,
//    no un booleano suelto: solo cuenta como "prendido" si esa fecha
//    es HOY. Así el interruptor nunca queda pegado de un día anterior
//    si el médico se olvida de apagarlo — a la medianoche deja de
//    tener efecto solo, sin necesidad de ningún proceso en segundo
//    plano que lo apague.
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

/**
 * Construye el instante exacto (fecha + hora) de un turno, en horario de
 * Argentina. A diferencia de fechaDesdeISO (mediodía fijo, para comparar
 * solo días), esto se usa para saber cuánto falta en minutos/horas reales
 * — ej. el cron de recordatorios. Argentina no tiene horario de verano
 * desde 2009, así que el offset fijo -03:00 es seguro todo el año.
 */
export function fechaHoraDesdeISO(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00-03:00`);
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
 * Esto NO mira activoDesde.
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
 * Se usa para decidir si el interruptor manual "Atender ahora"
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
 * ¿La atención especial ("Atender ahora") está vigente en este momento?
 *
 * Solo cuenta como prendida si se activó HOY (fecha de Argentina). Si se
 * activó ayer y nadie la apagó a mano, ya no tiene efecto — se "vence"
 * sola a la medianoche sin depender de ningún proceso externo.
 */
export function esAtencionEspecialHoy(
  config: AvailabilityConfig,
  now: Date = new Date()
): boolean {
  return config.activoDesde === toISODate(now);
}

/**
 * Estado de ATENCIÓN INMEDIATA.
 *
 * Regla:
 *
 * - Si estamos DENTRO del horario fijo de hoy, ya está cubierto
 *   por la agenda normal: disponible = true siempre, sin importar
 *   la atención especial. El interruptor manual no tiene efecto acá.
 *
 * - Si estamos FUERA del horario fijo de hoy, ahí sí decide
 *   esAtencionEspecialHoy: es el interruptor pensado para que el
 *   médico avise que atiende por fuera de su horario habitual
 *   (incluso un día marcado como no laborable), solo por hoy.
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
    disponible: esAtencionEspecialHoy(config, now),
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
 * activoDesde NO participa.
 *
 * Aunque el médico no esté atendiendo AHORA, los turnos
 * normales siguen disponibles.
 */
export function getSlotsForDate(
  config: AvailabilityConfig,
  date: Date,
  intervalMinutes = 30,
  now: Date = new Date()
): string[] {
  const schedule = getEffectiveScheduleForDate(config, date);

  if (!schedule.habilitado || !schedule.inicio || !schedule.fin) {
    return [];
  }

  const startMins = timeToMinutes(schedule.inicio);
  const endMins = timeToMinutes(schedule.fin);

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

/**
 * ¿"fin" es un horario válido posterior a "inicio"? Compara strings
 * "HH:MM" con padding fijo, por lo que la comparación lexicográfica
 * alcanza sin parsear. Se usa para rechazar rangos invertidos o vacíos
 * (ej. alguien tipeó 19:00 a 09:00) antes de que produzcan silenciosamente
 * cero turnos sin ninguna explicación.
 */
export function rangoHorarioValido(inicio: string, fin: string): boolean {
  return fin > inicio;
}

/** Hora actual "HH:MM" en horario de Argentina — para uso en el cliente. */
export function horaActualArgentina(now: Date = new Date()): string {
  return minutesToTime(partesEnArgentina(now).minutosDelDia);
}

/**
 * Formatea una fecha ISO ("2026-08-17") como "Lunes 17 de agosto", siempre
 * en horario de Argentina — sin importar el timezone del dispositivo que
 * la esté mostrando. Reemplaza implementaciones locales equivalentes que
 * había duplicadas (y, en el caso del cliente de reserva, rotas por
 * depender del timezone del navegador) en varias pantallas.
 */
export function formatFechaLargaAR(iso: string): string {
  const texto = fechaDesdeISO(iso).toLocaleDateString("es-AR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}