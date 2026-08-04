import nodemailer from "nodemailer";

// ==========================================================
// Envío real de mails vía SMTP (por ejemplo el de Hostinger:
// smtp.hostinger.com, puerto 465/SSL, igual al que ya usás en
// MiPerfil.ar). Si no hay credenciales SMTP configuradas, cae a
// un mock que solo loguea en consola — así el proyecto sigue
// andando en local sin depender de tener el mail configurado.
// ==========================================================

export function emailConfigurado(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EnviarEmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function enviarEmail(input: EnviarEmailInput): Promise<{ enviado: boolean }> {
  if (!emailConfigurado()) {
    console.log(
      `[email mock] Para: ${input.to} · Asunto: "${input.subject}"${
        input.attachments?.length ? ` · Adjuntos: ${input.attachments.map((a) => a.filename).join(", ")}` : ""
      }`
    );
    return { enviado: false };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });

  return { enviado: true };
}

/** Convierte un data URL ("data:application/pdf;base64,....") en un adjunto de nodemailer. */
export function dataUrlToAttachment(filename: string, dataUrl: string): EmailAttachment {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    throw new Error("dataUrl con formato inválido, se esperaba data:<mime>;base64,<contenido>");
  }
  const [, mimeType, base64] = match;
  return { filename, content: Buffer.from(base64, "base64"), contentType: mimeType };
}
