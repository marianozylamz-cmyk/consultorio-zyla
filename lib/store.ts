import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  AvailabilityConfig,
  Consultation,
  ConsultationStatus,
  DocumentFile,
  NotificationLog,
  Patient,
  Weekday,
} from "@/types";

// ==========================================================
// Acceso a datos — Supabase es la única fuente de verdad.
// Ya no hay estado en memoria ni archivo local: cada función acá
// abajo es una consulta real a la base, por eso todas son async.
//
// Esto reemplaza al store en memoria + .localdb/store.json que
// se usaba antes (útil para la v1 local, pero los datos se
// perdían entre despliegues de Vercel). lib/persistence.ts queda
// eliminado por completo — ya no tiene ningún rol.
// ==========================================================

// ---- Disponibilidad ----
// Fila única (id=1) en la tabla `availability`, ya creada de antes.

interface AvailabilityRow {
  activo_desde: string | null;
  horario_semanal: Record<Weekday, AvailabilityConfig["horarioSemanal"][Weekday]>;
  excepciones: AvailabilityConfig["excepciones"];
}

function rowToAvailability(row: AvailabilityRow): AvailabilityConfig {
  return {
    activoDesde: row.activo_desde,
    horarioSemanal: row.horario_semanal,
    excepciones: row.excepciones ?? [],
  };
}

export async function getAvailability(): Promise<AvailabilityConfig> {
  const { data, error } = await supabaseAdmin
    .from("availability")
    .select("activo_desde, horario_semanal, excepciones")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(`No se pudo leer la disponibilidad desde Supabase: ${error?.message ?? "sin datos"}`);
  }
  return rowToAvailability(data as AvailabilityRow);
}

export async function setAvailability(config: AvailabilityConfig): Promise<AvailabilityConfig> {
  const { data, error } = await supabaseAdmin
    .from("availability")
    .update({
      activo_desde: config.activoDesde,
      horario_semanal: config.horarioSemanal,
      excepciones: config.excepciones,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("activo_desde, horario_semanal, excepciones")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo guardar la disponibilidad en Supabase: ${error?.message ?? "sin datos"}`);
  }
  return rowToAvailability(data as AvailabilityRow);
}

// ---- Turnos reservados ----
// Esta es la capa que garantiza que dos pacientes no puedan
// quedarse con el mismo (doctor, fecha, hora). El unique constraint
// de la tabla es la única fuente real de esa garantía — todo lo
// demás (slots calculados, UI) es solo para mostrar disponibilidad,
// nunca para decidir si un turno "es válido".

export class SlotOcupadoError extends Error {
  constructor() {
    super("Ese horario ya fue reservado por otro paciente.");
    this.name = "SlotOcupadoError";
  }
}

async function reservarSlot(
  doctorId: string,
  fecha: string,
  hora: string,
  consultationId: string
): Promise<void> {
  const { error } = await supabaseAdmin.from("turnos_reservados").insert({
    doctor_id: doctorId,
    fecha,
    hora,
    consultation_id: consultationId,
  });

  if (error) {
    // 23505 = unique_violation: alguien reservó este (doctor, fecha, hora) primero.
    if (error.code === "23505") {
      throw new SlotOcupadoError();
    }
    throw new Error(`No se pudo reservar el turno: ${error.message}`);
  }
}

async function liberarSlot(consultationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("turnos_reservados")
    .delete()
    .eq("consultation_id", consultationId);

  if (error) {
    throw new Error(`No se pudo liberar el turno: ${error.message}`);
  }
}

/**
 * Libera el turno de una consulta cuando el pago se rechaza, expira o se
 * cancela — para que el horario vuelva a aparecer disponible para otros
 * pacientes. Se puede llamar más de una vez sin problema (delete de un
 * consultation_id que ya no existe simplemente no borra nada).
 */
export async function liberarTurnoDeConsulta(consultationId: string): Promise<void> {
  await liberarSlot(consultationId);
}

/**
 * Horas ya reservadas (turnos_reservados) para un doctor, agrupadas por
 * fecha, dentro de un conjunto de fechas dado. Se usa para no mostrar como
 * disponibles horarios que ya tiene otro paciente — lib/availability.ts es
 * puro y no sabe nada de esto a propósito; acá vive la única consulta real
 * a la tabla que es la fuente de verdad de "ocupado".
 */
export async function getHorasReservadasEnRango(
  doctorId: string,
  fechas: string[]
): Promise<Map<string, Set<string>>> {
  const porFecha = new Map<string, Set<string>>();
  if (fechas.length === 0) return porFecha;

  const { data, error } = await supabaseAdmin
    .from("turnos_reservados")
    .select("fecha, hora")
    .eq("doctor_id", doctorId)
    .in("fecha", fechas);

  if (error) {
    throw new Error(`No se pudieron leer los turnos reservados: ${error.message}`);
  }

  for (const fila of (data as { fecha: string; hora: string }[]) ?? []) {
    const horas = porFecha.get(fila.fecha) ?? new Set<string>();
    horas.add(fila.hora);
    porFecha.set(fila.fecha, horas);
  }
  return porFecha;
}

// ---- Consultas ----
// Ver supabase/migration.sql para el esquema completo asumido de esta tabla.

interface ConsultationRow {
  id: string;
  doctor_id: string;
  paciente: Patient;
  fecha: string;
  hora: string;
  es_ahora: boolean;
  recordatorio_enviado_at: string | null;
  precio: number;
  duracion_minutos: number;
  estado: ConsultationStatus;
  pago: Consultation["pago"];
  documentos: DocumentFile[];
  notificaciones: NotificationLog[];
  creada_en: string;
}

function rowToConsultation(row: ConsultationRow): Consultation {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    paciente: row.paciente,
    fecha: row.fecha,
    hora: row.hora,
    esAhora: row.es_ahora,
    recordatorioEnviadoAt: row.recordatorio_enviado_at,
    precio: Number(row.precio),
    duracionMinutos: row.duracion_minutos,
    estado: row.estado,
    pago: row.pago,
    creadaEn: row.creada_en,
    documentos: row.documentos ?? [],
    notificaciones: row.notificaciones ?? [],
  };
}

function consultationToInsertRow(c: Consultation) {
  return {
    id: c.id,
    doctor_id: c.doctorId,
    paciente: c.paciente,
    fecha: c.fecha,
    hora: c.hora,
    es_ahora: c.esAhora,
    precio: c.precio,
    duracion_minutos: c.duracionMinutos,
    estado: c.estado,
    pago: c.pago,
    documentos: c.documentos,
    notificaciones: c.notificaciones,
    creada_en: c.creadaEn,
  };
}

/** Convierte solo los campos presentes en el patch — para no pisar columnas que no vinieron en el update. */
function partialConsultationToRow(patch: Partial<Consultation>) {
  const row: Record<string, unknown> = {};
  if (patch.doctorId !== undefined) row.doctor_id = patch.doctorId;
  if (patch.paciente !== undefined) row.paciente = patch.paciente;
  if (patch.fecha !== undefined) row.fecha = patch.fecha;
  if (patch.hora !== undefined) row.hora = patch.hora;
  if (patch.precio !== undefined) row.precio = patch.precio;
  if (patch.duracionMinutos !== undefined) row.duracion_minutos = patch.duracionMinutos;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.pago !== undefined) row.pago = patch.pago;
  if (patch.documentos !== undefined) row.documentos = patch.documentos;
  if (patch.notificaciones !== undefined) row.notificaciones = patch.notificaciones;
  if (patch.creadaEn !== undefined) row.creada_en = patch.creadaEn;
  return row;
}

export async function listConsultations(): Promise<Consultation[]> {
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .select("*")
    .order("creada_en", { ascending: false });

  if (error) throw new Error(`No se pudieron listar las consultas: ${error.message}`);
  return ((data as ConsultationRow[]) ?? []).map(rowToConsultation);
}

export async function getConsultation(id: string): Promise<Consultation | undefined> {
  const { data, error } = await supabaseAdmin.from("consultations").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(`No se pudo leer la consulta ${id}: ${error.message}`);
  return data ? rowToConsultation(data as ConsultationRow) : undefined;
}

export async function createConsultation(consultation: Consultation): Promise<Consultation> {
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .insert(consultationToInsertRow(consultation))
    .select("*")
    .single();

  if (error || !data) throw new Error(`No se pudo crear la consulta: ${error?.message ?? "sin datos"}`);
  return rowToConsultation(data as ConsultationRow);
}

/**
 * Punto de entrada para crear una consulta CON reserva atómica del turno.
 * Este es el que hay que usar desde el endpoint POST /api/consultations —
 * `createConsultation` a secas queda como building block interno.
 *
 * Orden:
 *  1. Reservar el (doctor, fecha, hora) en turnos_reservados.
 *     Si ya está tomado, tira SlotOcupadoError y no se crea nada.
 *  2. Crear la fila de consultation.
 *     Si esto falla por lo que sea, se libera el turno reservado
 *     en el paso 1 (rollback manual, ya que son dos tablas separadas).
 */
export async function createConsultationConReserva(consultation: Consultation): Promise<Consultation> {
  await reservarSlot(consultation.doctorId, consultation.fecha, consultation.hora, consultation.id);

  try {
    return await createConsultation(consultation);
  } catch (error) {
    await liberarSlot(consultation.id).catch(() => {
      // Si esto también falla, queda un turno reservado "fantasma" sin
      // consulta asociada. Hay que revisarlo a mano en Supabase — pero
      // no debería pasar salvo un corte de conexión justo en el medio.
      console.error(
        `No se pudo liberar el turno reservado tras un error creando la consulta ${consultation.id}`
      );
    });
    throw error;
  }
}

export async function updateConsultation(
  id: string,
  patch: Partial<Consultation>
): Promise<Consultation | undefined> {
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .update(partialConsultationToRow(patch))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar la consulta ${id}: ${error.message}`);
  return data ? rowToConsultation(data as ConsultationRow) : undefined;
}

/**
 * Igual que updateConsultation, pero atómico: solo aplica el patch (y
 * devuelve la fila) si el estado ANTES del update era `estadoEsperado`. Si
 * ya cambió (por ejemplo, Mercado Pago mandó la misma notificación de pago
 * dos veces casi en simultáneo), devuelve undefined y no vuelve a
 * escribir nada — evita el mail duplicado al médico/secretaria y una
 * doble notificación al paciente en el caso de dos webhooks concurrentes.
 */
export async function updateConsultationSiEstadoEs(
  id: string,
  estadoEsperado: ConsultationStatus,
  patch: Partial<Consultation>
): Promise<Consultation | undefined> {
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .update(partialConsultationToRow(patch))
    .eq("id", id)
    .eq("estado", estadoEsperado)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar la consulta ${id}: ${error.message}`);
  return data ? rowToConsultation(data as ConsultationRow) : undefined;
}

/**
 * Candidatas a recordatorio: turnos agendados (no "ahora"), pagados y
 * confirmados (`esperando`), que todavía no recibieron el mail. El filtro
 * de fecha/hora exacto ("¿falta menos de 1 hora?") se hace en JS sobre este
 * resultado — acá solo se recorta a lo estrictamente relevante para no
 * traer turnos rechazados, ya atendidos o de otro tipo.
 */
export async function listConsultationsParaRecordatorio(): Promise<Consultation[]> {
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .select("*")
    .eq("estado", "esperando")
    .eq("es_ahora", false)
    .is("recordatorio_enviado_at", null);

  if (error) throw new Error(`No se pudieron listar las consultas para recordatorio: ${error.message}`);
  return ((data as ConsultationRow[]) ?? []).map(rowToConsultation);
}

/**
 * "Reclama" el envío del recordatorio de forma atómica: solo actualiza (y
 * devuelve la fila) si `recordatorio_enviado_at` todavía era null. Si otra
 * ejecución del cron ya lo tomó primero, devuelve undefined — el llamador
 * usa eso para NO mandar el mail de nuevo. Por diseño, se marca ANTES de
 * mandar el mail (no después): prioriza no duplicar sobre reintentar un
 * envío que falló por una falla transitoria de SMTP.
 */
export async function reclamarRecordatorio(id: string): Promise<Consultation | undefined> {
  const { data, error } = await supabaseAdmin
    .from("consultations")
    .update({ recordatorio_enviado_at: new Date().toISOString() })
    .eq("id", id)
    .is("recordatorio_enviado_at", null)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`No se pudo reclamar el recordatorio de la consulta ${id}: ${error.message}`);
  return data ? rowToConsultation(data as ConsultationRow) : undefined;
}

// ---- Documentos ----
// Los documentos viven dentro de la columna jsonb `documentos` de la
// consulta (igual que en el modelo anterior). Con un solo médico y bajo
// volumen de escrituras concurrentes, hacer read-modify-write acá es
// simple y suficiente; si en algún momento hay alta concurrencia real,
// esto se puede mover a una tabla `documents` aparte con su propio FK.

export async function addDocumentToConsultation(
  consultationId: string,
  doc: DocumentFile
): Promise<DocumentFile | undefined> {
  const consultation = await getConsultation(consultationId);
  if (!consultation) return undefined;

  const documentos = [...consultation.documentos, doc];
  const updated = await updateConsultation(consultationId, { documentos });
  return updated ? doc : undefined;
}

export async function markDocumentSent(
  consultationId: string,
  documentId: string
): Promise<DocumentFile | undefined> {
  const consultation = await getConsultation(consultationId);
  if (!consultation) return undefined;

  const doc = consultation.documentos.find((d) => d.id === documentId);
  if (!doc) return undefined;

  const documentos = consultation.documentos.map((d) =>
    d.id === documentId ? { ...d, enviado: true, enviadoEn: new Date().toISOString() } : d
  );
  const updated = await updateConsultation(consultationId, { documentos });
  return updated ? updated.documentos.find((d) => d.id === documentId) : undefined;
}