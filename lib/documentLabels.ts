import { DocumentType } from "@/types";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  receta: "Receta",
  certificado: "Certificado",
  indicaciones: "Indicaciones",
  observaciones: "Observaciones",
  solicitud_estudios: "Solicitud de estudios",
  otro: "Documento",
};

/**
 * Nombre de archivo para un PDF generado por el sistema (certificado,
 * observaciones, solicitud de estudios). Usa la hora exacta de generación
 * (no la fecha de la consulta) porque el médico puede generar más de un
 * documento del mismo tipo para la misma consulta el mismo día — sin la
 * hora, dos PDFs distintos terminan con el mismo nombre y no hay forma de
 * distinguirlos en la lista de "Documentos".
 */
export function nombreArchivoDocumento(prefijo: string, pacienteNombre: string): string {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
  const hora = ahora
    .toLocaleTimeString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" })
    .slice(0, 5)
    .replace(":", "");
  const paciente = pacienteNombre.replace(/\s+/g, "_").toLowerCase();
  return `${prefijo}-${paciente}-${fecha}-${hora}.pdf`;
}
