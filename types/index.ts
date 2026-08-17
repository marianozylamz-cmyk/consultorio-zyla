// ==========================================================
// Tipos centrales del dominio. Todo el producto gira
// alrededor de estos objetos: Doctor, Disponibilidad,
// Paciente, Consulta y Documento.
// ==========================================================

export type Weekday = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export interface DoctorProfile {
  id: string;
  slug: string; // pensado para el futuro white-label: /[slug]
  nombre: string;
  profesion: string;
  especialidad: string;
  matricula: string | null; // OBLIGATORIO antes de emitir certificados — ver validación en lib/certificatePdf.ts
  ciudad: string;
  provincia: string;
  consultorio: {
    nombre: string;
    direccion: string;
    horario: string;
    telefono: string; // línea de llamadas del consultorio (se muestra públicamente)
    whatsapp: string; // WhatsApp del consultorio/secretaría (se muestra públicamente, NO es el celular personal del médico)
  };
  servicios: string[];
  sobreMi: string;
  contacto: {
    emailNotificaciones: string; // interno: acá le llegan al médico las alertas de nuevas consultas. Nunca se muestra en la landing.
  };
  colores: {
    principal: string;
    secundario: string;
  };
  consultaOnline: {
    precio: number;
    duracionMinutos: number;
  };
  videollamadaUrl: string; // link fijo de Google Meet donde se hacen todas las consultas online
}

export interface DaySchedule {
  habilitado: boolean;
  inicio: string; // "17:00"
  fin: string; // "19:00"
}

export interface AvailabilityOverride {
  fecha: string; // ISO date "2026-07-31"
  cerrado: boolean;
  inicio?: string;
  fin?: string;
}

export interface AvailabilityConfig {
  // Fecha ISO ("2026-08-15") del día en que el médico activó "Atender ahora"
  // fuera de su horario habitual, o null si está apagado. Solo cuenta como
  // vigente si coincide con la fecha de HOY (ver esAtencionEspecialHoy en
  // lib/availability.ts) — así el interruptor nunca queda prendido "para
  // siempre" arrastrado de un día anterior.
  activoDesde: string | null;
  horarioSemanal: Record<Weekday, DaySchedule>;
  excepciones: AvailabilityOverride[];
}

export type ConsultationStatus =
  | "pendiente_pago"
  | "esperando"
  | "lista"
  | "en_consulta"
  | "finalizada"
  | "rechazada";

export interface Patient {
  nombre: string;
  dni: string;
  whatsapp: string;
  email: string;
}

export interface Consultation {
  id: string;
  doctorId: string; // referencia al profesional — hoy siempre doctorProfile.id, pero deja el modelo listo para multi-médico
  paciente: Patient;
  fecha: string; // ISO date
  hora: string; // "17:30"
  esAhora: boolean; // true = reservada por "Atender ahora" (atención inmediata), no un turno agendado
  recordatorioEnviadoAt: string | null; // ISO timestamp — null hasta que se manda el recordatorio de 1hs antes
  precio: number;
  duracionMinutos: number;
  estado: ConsultationStatus;
  pago: {
    estado: "pendiente" | "aprobado" | "rechazado";
    metodo: "mock" | "mercadopago";
    fechaAprobacion?: string;
    mpPreferenceId?: string;
    mpPaymentId?: string;
  };
  creadaEn: string;
  documentos: DocumentFile[];
  notificaciones: NotificationLog[];
}

export type DocumentType = "receta" | "certificado" | "indicaciones" | "otro";

export interface DocumentFile {
  id: string;
  consultationId: string;
  nombre: string;
  tipo: DocumentType;
  mimeType: string;
  dataUrl: string; // simulación de almacenamiento (base64) - reemplazable por S3/Supabase
  subidoEn: string;
  enviado: boolean;
  enviadoEn?: string;
}

export interface CertificateInput {
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  periodoInvalidez: string; // texto libre, ej: "Del 03/08/2026 al 06/08/2026 (3 días)"
  destinatario?: string; // empresa / institución a la que se dirige
  observaciones?: string;
}

export interface NotificationLog {
  canal: "email" | "whatsapp" | "push";
  mensaje: string;
  enviadoEn: string;
}