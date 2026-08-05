import { DocumentFile, DocumentType } from "@/types";
import { addDocumentToConsultation, markDocumentSent } from "@/lib/store";
import { genId } from "@/lib/ids";

// ==========================================================
// Documentos (recetas/certificados/indicaciones). La plataforma
// NO genera recetas: solo recibe archivos que Juan ya emitió en
// su sistema externo, y se los envía al paciente por mail
// directo como adjunto (ver notificationService.sendDocumentToPatient).
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
      enviado: false,
    };
    await addDocumentToConsultation(input.consultationId, doc);
    return doc;
  }

  async marcarEnviado(consultationId: string, documentId: string) {
    return markDocumentSent(consultationId, documentId);
  }
}

export const documentService = new DocumentService();
