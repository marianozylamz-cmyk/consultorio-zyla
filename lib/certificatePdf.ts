import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CertificateInput, Consultation } from "@/types";
import { doctorProfile } from "@/data/doctorProfile";

// ==========================================================
// Genera el PDF del certificado médico digital, siguiendo el
// formato acordado. Se arma en el servidor con pdf-lib (no hace
// falta ninguna herramienta externa ni sistema de recetas — esto
// es exclusivamente para certificados simples).
//
// VALIDACIÓN OBLIGATORIA: si `doctorProfile.matricula` no está
// cargada, esta función tira un error a propósito. Preferimos
// bloquear la emisión antes que dejar salir un certificado sin
// matrícula real — ese dato no se puede inventar.
// ==========================================================

const NAVY = rgb(11 / 255, 31 / 255, 58 / 255);
const GRIS = rgb(0.42, 0.47, 0.54);
const NEGRO = rgb(0.09, 0.12, 0.2);

function envolverTexto(texto: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(prueba, size) > maxWidth && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length > 0 ? lineas : [""];
}

function formatFechaCortaAR(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Cantidad de días entre dos fechas ISO, inclusive en ambos extremos. */
function diasEntre(desde: string, hasta: string): number {
  const ms = new Date(`${hasta}T00:00:00Z`).getTime() - new Date(`${desde}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export async function generarCertificadoPdf(
  consultation: Consultation,
  input: CertificateInput
): Promise<Buffer> {
  if (!doctorProfile.matricula) {
    throw new Error(
      "Falta cargar la matrícula del médico en data/doctorProfile.ts — no se puede emitir un certificado sin ese dato."
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margenX = 60;
  const anchoUtil = width - margenX * 2;
  let y = height - 70;

  function linea(texto: string, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const { bold = false, size = 11, color = NEGRO, gap = 18 } = opts;
    page.drawText(texto, { x: margenX, y, size, font: bold ? fontBold : font, color });
    y -= gap;
  }

  function parrafo(texto: string, opts: { size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const { size = 11, color = NEGRO, gap = 16 } = opts;
    const lineas = envolverTexto(texto, font, size, anchoUtil);
    for (const l of lineas) {
      page.drawText(l, { x: margenX, y, size, font, color });
      y -= gap;
    }
  }

  function espacio(px = 10) {
    y -= px;
  }

  // Encabezado
  linea("CERTIFICADO MÉDICO DIGITAL", { bold: true, size: 16, color: NAVY, gap: 26 });
  page.drawLine({
    start: { x: margenX, y: y + 8 },
    end: { x: width - margenX, y: y + 8 },
    thickness: 1,
    color: NAVY,
  });
  espacio(14);

  const fechaEmision = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(consultation.creadaEn));
  linea(`Fecha de emisión: ${fechaEmision}`, { size: 10, color: GRIS, gap: 15 });
  linea(`Lugar: ${doctorProfile.ciudad}, ${doctorProfile.provincia}`, { size: 10, color: GRIS, gap: 26 });

  parrafo("Por la presente se certifica que el/la Sr./Sra.", { gap: 16 });
  linea(consultation.paciente.nombre.toUpperCase(), { bold: true, size: 13, gap: 18 });
  linea(`DNI Nº ${consultation.paciente.dni}`, { gap: 24 });

  parrafo("ha sido atendido/a en forma virtual por plataforma digital.", { gap: 26 });

  if (input.motivo) {
    linea("Motivo de consulta:", { bold: true, gap: 16 });
    parrafo(input.motivo, { gap: 22 });
  }

  linea("Diagnóstico:", { bold: true, gap: 16 });
  parrafo(input.diagnostico || "—", { gap: 22 });

  linea("Tratamiento indicado:", { bold: true, gap: 16 });
  parrafo(input.tratamiento || "—", { gap: 22 });

  // Solo se imprime si el médico cargó las dos puntas del período — un
  // período con una sola fecha no dice nada, mejor no mostrar nada a
  // mostrar algo a medias.
  if (input.licenciaDesde && input.licenciaHasta) {
    const dias = diasEntre(input.licenciaDesde, input.licenciaHasta);
    linea("Período de licencia:", { bold: true, gap: 16 });
    parrafo(
      `Del ${formatFechaCortaAR(input.licenciaDesde)} al ${formatFechaCortaAR(input.licenciaHasta)} (${dias} ${dias === 1 ? "día" : "días"}).`,
      { gap: 22 }
    );
  }

  if (input.destinatario) {
    linea("Dirigido a:", { bold: true, gap: 16 });
    parrafo(input.destinatario, { gap: 22 });
  }

  if (input.observaciones) {
    linea("Observaciones:", { bold: true, gap: 16 });
    parrafo(input.observaciones, { gap: 22 });
  }

  espacio(10);
  parrafo("Se extiende el presente documento a pedido del paciente.", { gap: 30 });

  // Identificación del médico — chica y discreta a propósito, sin firma
  // (ni digital ni escaneada): es un dato de referencia, no una firma.
  page.drawLine({
    start: { x: margenX, y: y + 8 },
    end: { x: margenX + 160, y: y + 8 },
    thickness: 0.75,
    color: GRIS,
  });
  espacio(6);
  linea(`Dr. ${doctorProfile.nombre}`, { bold: true, size: 10, color: GRIS, gap: 13 });
  linea(doctorProfile.profesion, { size: 9, color: GRIS, gap: 13 });
  linea(`M.P. ${doctorProfile.matricula}`, { size: 9, color: GRIS, gap: 13 });

  // Validación digital simple: código trazable, derivado del id de la consulta.
  // No reemplaza una firma digital certificada — es una referencia interna
  // para poder confirmar la autenticidad de una copia ante una duda puntual.
  const codigoVerificacion = `${consultation.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  page.drawText(`Código de verificación: ${codigoVerificacion}`, {
    x: margenX,
    y: 50,
    size: 8,
    font,
    color: GRIS,
  });
  page.drawText("Documento emitido digitalmente — Consultorio Online Dr. Zyla", {
    x: margenX,
    y: 38,
    size: 8,
    font,
    color: GRIS,
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

/**
 * PDF de "Observaciones médicas" — mismo estilo visual que el certificado
 * (encabezado, datos del paciente, identificación profesional chica al
 * pie, código de verificación), pero con un solo texto libre que escribe
 * el médico. Sin firma digital ni escaneada, igual que el certificado.
 */
export async function generarObservacionesPdf(consultation: Consultation, texto: string): Promise<Buffer> {
  if (!doctorProfile.matricula) {
    throw new Error(
      "Falta cargar la matrícula del médico en data/doctorProfile.ts — no se puede emitir un documento sin ese dato."
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margenX = 60;
  const anchoUtil = width - margenX * 2;
  let y = height - 70;

  function linea(texto: string, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const { bold = false, size = 11, color = NEGRO, gap = 18 } = opts;
    page.drawText(texto, { x: margenX, y, size, font: bold ? fontBold : font, color });
    y -= gap;
  }

  function parrafo(texto: string, opts: { size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const { size = 11, color = NEGRO, gap = 16 } = opts;
    const lineas = envolverTexto(texto, font, size, anchoUtil);
    for (const l of lineas) {
      page.drawText(l, { x: margenX, y, size, font, color });
      y -= gap;
    }
  }

  function espacio(px = 10) {
    y -= px;
  }

  linea("OBSERVACIONES MÉDICAS", { bold: true, size: 16, color: NAVY, gap: 26 });
  page.drawLine({
    start: { x: margenX, y: y + 8 },
    end: { x: width - margenX, y: y + 8 },
    thickness: 1,
    color: NAVY,
  });
  espacio(14);

  const fechaEmision = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  linea(`Fecha: ${fechaEmision}`, { size: 10, color: GRIS, gap: 26 });

  linea("Paciente:", { bold: true, gap: 16 });
  linea(consultation.paciente.nombre, { size: 13, gap: 18 });
  linea(`DNI Nº ${consultation.paciente.dni}`, { gap: 26 });

  parrafo(texto, { gap: 18 });

  espacio(20);
  page.drawLine({
    start: { x: margenX, y: y + 8 },
    end: { x: margenX + 160, y: y + 8 },
    thickness: 0.75,
    color: GRIS,
  });
  espacio(6);
  linea(`Dr. ${doctorProfile.nombre}`, { bold: true, size: 10, color: GRIS, gap: 13 });
  linea(doctorProfile.profesion, { size: 9, color: GRIS, gap: 13 });
  linea(`M.P. ${doctorProfile.matricula}`, { size: 9, color: GRIS, gap: 13 });

  const codigoVerificacion = `${consultation.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  page.drawText(`Código de verificación: ${codigoVerificacion}`, {
    x: margenX,
    y: 50,
    size: 8,
    font,
    color: GRIS,
  });
  page.drawText("Documento emitido digitalmente — Consultorio Online Dr. Zyla", {
    x: margenX,
    y: 38,
    size: 8,
    font,
    color: GRIS,
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
