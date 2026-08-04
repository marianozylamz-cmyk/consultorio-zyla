import { DocumentFile, DocumentType } from "@/types";
import { addDocumentToConsultation, genId, markDocumentSent } from "@/lib/store";

// ==========================================================
// Documentos (recetas/certificados/indicaciones). La plataforma
// NO genera recetas: solo recibe archivos que Juan ya emitió en
// su sistema externo, y se los envía al paciente por mail
// directo como adjunto (ver notificationService.sendDocumentToPatient).
//
// Hoy: almacenamiento simulado (base64 en memoria).
// Mañana: reemplazar `guardar()` por una subida real a
// S3 / Supabase Storage / Cloudinary, guardando la URL firmada
// en vez del dataUrl.
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
    addDocumentToConsultation(input.consultationId, doc);
    return doc;
  }

  async marcarEnviado(consultationId: string, documentId: string) {
    return markDocumentSent(consultationId, documentId);
  }
}

export const documentService = new DocumentService();
