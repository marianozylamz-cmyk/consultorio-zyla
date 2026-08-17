import { Consultation, DocumentFile, NotificationLog } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { enviarEmail, dataUrlToAttachment } from "@/lib/email";
import { DOCUMENT_TYPE_LABEL } from "@/lib/documentLabels";
import { formatFechaLargaAR } from "@/lib/availability";

// ==========================================================
// Sistema de notificaciones al médico. Juan puede estar en
// otra habitación, así que no dependemos de un solo canal.
//
// EmailNotificationService ya envía mails reales (ver
// lib/email.ts) si hay credenciales SMTP configuradas; si no,
// cae solo a loguear en consola, para que el proyecto siga
// andando en local sin depender de tener el mail configurado.
//
// WhatsAppNotificationService sigue simulado: para que mande
// mensajes reales hace falta la WhatsApp Business API oficial
// (Meta Cloud API o un proveedor como Twilio/360dialog) con una
// plantilla pre-aprobada por Meta — no se puede activar solo con
// código, así que queda documentado acá para cuando Juan tenga
// esa cuenta lista.
// ==========================================================

interface NotificationChannel {
  canal: NotificationLog["canal"];
  enviar(consultation: Consultation): Promise<NotificationLog>;
}

function mensajeNuevaConsulta(consultation: Consultation) {
  return `🩺 NUEVA CONSULTA ONLINE\n${consultation.paciente.nombre} está esperando.\nConsulta: ${consultation.duracionMinutos} minutos\nPago: Confirmado`;
}

function linkEsperaDe(consultation: Consultation): string {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}/consulta/${consultation.id}/espera`;
}

/** Botón con estilos inline — los clientes de mail ignoran <style>/clases, así que va todo en el atributo. */
function botonEmail(href: string, texto: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#1B6E5C;color:#ffffff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block">${texto}</a></p>`;
}

class EmailNotificationService implements NotificationChannel {
  canal: "email" = "email";
  async enviar(consultation: Consultation): Promise<NotificationLog> {
    const mensaje = mensajeNuevaConsulta(consultation);
    const html = `
      <p><strong>🩺 Nueva consulta online</strong></p>
      <p>${consultation.paciente.nombre} está esperando.</p>
      <p>Consulta de ${consultation.duracionMinutos} minutos · Pago confirmado.</p>
      <p><a href="${process.env.APP_BASE_URL ?? "http://localhost:3000"}/admin">Entrar al panel</a></p>
    `;
    await enviarEmail({ to: doctorProfile.contacto.emailNotificaciones, subject: "Nueva consulta online", html });
    return { canal: "email", mensaje, enviadoEn: new Date().toISOString() };
  }
}

class WhatsAppNotificationService implements NotificationChannel {
  canal: "whatsapp" = "whatsapp";
  async enviar(consultation: Consultation): Promise<NotificationLog> {
    const mensaje = mensajeNuevaConsulta(consultation);
    // En producción: llamar a la WhatsApp Business API (proveedor oficial,
    // ej. Meta Cloud API / Twilio) enviando una plantilla aprobada con
    // el link directo a /admin/consulta/[id].
    console.log(`[WhatsAppNotificationService] WhatsApp simulado enviado al Dr. Zyla:\n${mensaje}`);
    return { canal: "whatsapp", mensaje, enviadoEn: new Date().toISOString() };
  }
}

class BrowserNotificationService implements NotificationChannel {
  canal: "push" = "push";
  async enviar(consultation: Consultation): Promise<NotificationLog> {
    const mensaje = `Nueva consulta de ${consultation.paciente.nombre}`;
    // La notificación real de navegador + sonido se dispara del lado del
    // cliente (ver /app/admin) cuando el polling detecta una consulta
    // nueva en estado "esperando".
    console.log(`[BrowserNotificationService] Push simulado: ${mensaje}`);
    return { canal: "push", mensaje, enviadoEn: new Date().toISOString() };
  }
}

class NotificationService {
  private channels: NotificationChannel[] = [
    new EmailNotificationService(),
    new WhatsAppNotificationService(),
    new BrowserNotificationService(),
  ];

  async notifyDoctorNewConsultation(consultation: Consultation): Promise<NotificationLog[]> {
    const results = await Promise.all(this.channels.map((c) => c.enviar(consultation)));
    return results;
  }

  /**
   * Manda el documento (receta/certificado/indicaciones) al paciente por
   * mail, como adjunto real — un solo clic del médico, sin que tenga que
   * escribir nada a mano. Devuelve `enviado: false` si no hay SMTP
   * configurado (en vez de tirar error), para que el llamador decida cómo
   * avisarlo.
   */
  async sendDocumentToPatient(consultation: Consultation, doc: DocumentFile): Promise<{ enviado: boolean }> {
    const attachment = dataUrlToAttachment(doc.dataUrl, doc.nombre);
    const tipoLabel = DOCUMENT_TYPE_LABEL[doc.tipo];
    const asunto = `${tipoLabel} — Dr. ${doctorProfile.nombre}`;
    const html = `
      <p>Hola ${consultation.paciente.nombre},</p>
      <p>Te envío tu ${tipoLabel.toLowerCase()} de la consulta del ${formatFechaLargaAR(consultation.fecha)}.</p>
      <p>Encontrás el archivo adjunto a este mail.</p>
      <p>Saludos,<br>Dr. ${doctorProfile.nombre}</p>
    `;
    return enviarEmail({ to: consultation.paciente.email, subject: asunto, html, attachments: [attachment] });
  }

  /**
   * Confirmación de turno al paciente — solo para turnos agendados
   * (`esAhora: false`). Una atención inmediata no necesita este mail: el
   * paciente ya está viendo la confirmación en pantalla en ese momento.
   */
  async notifyPatientBookingConfirmed(consultation: Consultation): Promise<{ enviado: boolean }> {
    const fecha = formatFechaLargaAR(consultation.fecha);
    const html = `
      <p>Hola ${consultation.paciente.nombre},</p>
      <p>Tu turno con el Dr. ${doctorProfile.nombre} quedó confirmado:</p>
      <p style="font-size:18px"><strong>${fecha} a las ${consultation.hora} hs</strong></p>
      <p>Te vamos a avisar de nuevo 1 hora antes. Cuando sea el momento, entrá a tu sala de espera desde acá:</p>
      ${botonEmail(linkEsperaDe(consultation), "Ingresar a mi sala de espera")}
      <p>Ante cualquier duda, escribinos por WhatsApp.</p>
      <p>Saludos,<br>Dr. ${doctorProfile.nombre}</p>
    `;
    return enviarEmail({ to: consultation.paciente.email, subject: "Turno confirmado", html });
  }

  /**
   * Recordatorio 1 hora antes de un turno agendado. Lleva a la sala de
   * espera (no directo a Google Meet): ahí es donde se decide si ya
   * corresponde habilitar el ingreso a la videollamada, no en el mail.
   */
  async notifyPatientReminder(consultation: Consultation): Promise<{ enviado: boolean }> {
    const html = `
      <p>Hola ${consultation.paciente.nombre},</p>
      <p>Tu turno con el Dr. ${doctorProfile.nombre} es en aproximadamente 1 hora, a las <strong>${consultation.hora} hs</strong>.</p>
      <p>Cuando estés listo, entrá a tu sala de espera desde acá:</p>
      ${botonEmail(linkEsperaDe(consultation), "Ingresar a mi sala de espera")}
      <p>Saludos,<br>Dr. ${doctorProfile.nombre}</p>
    `;
    return enviarEmail({ to: consultation.paciente.email, subject: "Tu turno es en 1 hora", html });
  }
}

export const notificationService = new NotificationService();
