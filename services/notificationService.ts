import { Consultation, DocumentFile, NotificationLog } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { enviarEmail, dataUrlToAttachment } from "@/lib/email";

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

  /** Envía el documento directo como adjunto por mail al paciente (decisión: sin link intermedio). */
  async sendDocumentToPatient(consultation: Consultation, doc: DocumentFile): Promise<NotificationLog> {
    const TIPO_LABEL: Record<string, string> = {
      receta: "Receta",
      certificado: "Certificado",
      indicaciones: "Indicaciones",
      otro: "Documento",
    };

    const html = `
      <p>Hola ${consultation.paciente.nombre},</p>
      <p>El Dr. Zyla te envía tu ${TIPO_LABEL[doc.tipo] ?? "documento"} de la consulta del ${consultation.fecha}.</p>
      <p>Lo encontrás adjunto a este mail.</p>
      <p>Saludos,<br/>Dr. ${doctorProfile.nombre}</p>
    `;

    await enviarEmail({
      to: consultation.paciente.email,
      subject: `${TIPO_LABEL[doc.tipo] ?? "Documento"} — Dr. ${doctorProfile.nombre}`,
      html,
      attachments: [dataUrlToAttachment(doc.nombre, doc.dataUrl)],
    });

    const mensaje = `Documento "${doc.nombre}" enviado por mail a ${consultation.paciente.email}`;
    return { canal: "email", mensaje, enviadoEn: new Date().toISOString() };
  }
}

export const notificationService = new NotificationService();
