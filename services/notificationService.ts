import { Consultation, NotificationLog } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";
import { enviarEmail } from "@/lib/email";

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

  // Nota: el envío de documentos/certificados al paciente por mail NO pasa
  // por acá — un mailto: no puede adjuntar un archivo automáticamente
  // (limitación real del estándar, no de esta app), así que ese flujo es
  // 100% del lado del cliente: descarga el archivo y abre el cliente de
  // correo del médico con destinatario/asunto/cuerpo ya completos. Ver
  // enviarDocumento() en app/admin/consulta/[id]/page.tsx.
}

export const notificationService = new NotificationService();
