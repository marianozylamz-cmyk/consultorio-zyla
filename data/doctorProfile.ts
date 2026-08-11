import { AvailabilityConfig, DoctorProfile } from "@/types";

// ==========================================================
// Objeto central con TODOS los datos del médico.
// Si mañana esto se convierte en multi-médico, cada
// profesional tiene su propio DoctorProfile + AvailabilityConfig,
// y esta pieza se reemplaza por una consulta a la base de datos
// según el slug de la URL (/[slug]).
// ==========================================================

export const doctorProfile: DoctorProfile = {
  id: "doc_juan_zyla",
  slug: "juan-zyla",
  nombre: "Juan Manuel Zyla",
  profesion: "Médico",
  especialidad: "Especialista en Clínica Médica",
  // OBLIGATORIO antes de emitir certificados. Completar con el número real de
  // matrícula nacional/provincial de Juan (ver bloqueo en lib/certificatePdf.ts:
  // si esto queda en null, la plataforma no deja generar certificados).
  matricula: "480000",
  ciudad: "Olavarría",
  provincia: "Buenos Aires",
  consultorio: {
    nombre: "Consultorios Médicos Cabral",
    direccion: "Sgto. Cabral 2959",
    horario: "Lunes a Viernes de 10:00 a 17:00 hs.",
    telefono: "480000",
    whatsapp: "2284479009",
  },
  servicios: [
    "Medicina Clínica",
    "Medicina Laboral",
    "Licencias Médicas del Personal Docente y No Docente de la Provincia de Buenos Aires",
    "Control de Ausentismo",
    "Pericias Médicas",
  ],
  sobreMi:
    "Soy médico especialista en Clínica Médica y desarrollo mi actividad profesional en Olavarría, Buenos Aires.",
  contacto: {
    // Mail interno donde le llegan a Juan las alertas de "nueva consulta". No se muestra en la web pública.
    emailNotificaciones: "contacto@juanzyla.com.ar",
  },
  colores: {
    principal: "#0B1F3A",
    secundario: "#163A63",
  },
  consultaOnline: {
    precio: 100,
    duracionMinutos: 15,
  },
  // Sala fija de Google Meet donde se hacen todas las consultas online.
  // Es un evento de Calendar (no una reunión instantánea), así que no caduca
  // por inactividad. Si algún día hace falta cambiarla, es el único lugar
  // que hay que tocar.
  videollamadaUrl: "https://meet.google.com/sbh-dzon-eph",
};

// Configuración de disponibilidad inicial: todos los días 17:00 a 19:00.
export const defaultAvailability: AvailabilityConfig = {
  activo: true,
  horarioSemanal: {
    lun: { habilitado: true, inicio: "17:00", fin: "19:00" },
    mar: { habilitado: true, inicio: "17:00", fin: "19:00" },
    mie: { habilitado: true, inicio: "17:00", fin: "19:00" },
    jue: { habilitado: true, inicio: "17:00", fin: "19:00" },
    vie: { habilitado: true, inicio: "17:00", fin: "19:00" },
    sab: { habilitado: true, inicio: "17:00", fin: "19:00" },
    dom: { habilitado: true, inicio: "17:00", fin: "19:00" },
  },
  excepciones: [],
};