import { DocumentFile, DocumentType } from "@/types";
import { addDocumentToConsultation } from "@/lib/store";
import { genId } from "@/lib/ids";

// ==========================================================
// Documentos (certificados/observaciones generados por el sistema, o
// recetas/indicaciones que Juan sube como archivo). El envío al paciente
// es a nivel consulta — un solo mail con todos los adjuntos disponibles,
// ver notificationService.sendAllDocumentsToPatient.
//
// Almacenamiento: el archivo (base64) vive en la columna jsonb
// `documentos` de la consulta, en Supabase. Para producción con
// archivos grandes o mucho volumen, conviene migrar a Supabase
// Storage y guardar acá solo la URL — ver nota en supabase/migration.sql.
// ==========================================================

class DocumentService {
  async guardar(input: {
    consultationId: string;
    nombre: string;
    tipo: DocumentType;
    mimeType: string;
    dataUrl: string;
  }): Promise<DocumentFile> {
    const doc: DocumentFile = {
      id: genId("doc"),
      consultationId: input.consultationId,
      nombre: input.nombre,
      tipo: input.tipo,
      mimeType: input.mimeType,
      dataUrl: input.dataUrl,
      subidoEn: new Date().toISOString(),
    };
    await addDocumentToConsultation(input.consultationId, doc);
    return doc;
  }
}

export const documentService = new DocumentService();
