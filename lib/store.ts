import { AvailabilityConfig, Consultation, DocumentFile } from "@/types";
import { loadData, saveData } from "@/lib/persistence";

// ==========================================================
// Estado del servidor, ahora respaldado en disco (ver
// lib/persistence.ts). Se cachea en globalThis para no leer el
// archivo en cada request y para que ambas pestañas (paciente /
// admin) vean siempre el mismo estado dentro del mismo proceso.
// Cada mutación se persiste inmediatamente a .localdb/store.json.
// ==========================================================

interface Store {
  availability: AvailabilityConfig;
  consultations: Consultation[];
}

const globalForStore = globalThis as unknown as { __consultorioStore?: Store };

function getStore(): Store {
  if (!globalForStore.__consultorioStore) {
    globalForStore.__consultorioStore = loadData();
  }
  return globalForStore.__consultorioStore;
}

function persist() {
  saveData(getStore());
}

// ---- Disponibilidad ----
export function getAvailability(): AvailabilityConfig {
  return getStore().availability;
}

export function setAvailability(config: AvailabilityConfig) {
  getStore().availability = config;
  persist();
  return getStore().availability;
}

// ---- Consultas ----
export function listConsultations(): Consultation[] {
  return getStore().consultations.slice().sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : -1));
}

export function getConsultation(id: string): Consultation | undefined {
  return getStore().consultations.find((c) => c.id === id);
}

export function createConsultation(consultation: Consultation) {
  getStore().consultations.push(consultation);
  persist();
  return consultation;
}

export function updateConsultation(id: string, patch: Partial<Consultation>) {
  const store = getStore();
  const idx = store.consultations.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  store.consultations[idx] = { ...store.consultations[idx], ...patch };
  persist();
  return store.consultations[idx];
}

// ---- Documentos ----
export function addDocumentToConsultation(consultationId: string, doc: DocumentFile) {
  const consultation = getConsultation(consultationId);
  if (!consultation) return undefined;
  consultation.documentos.push(doc);
  persist();
  return doc;
}

export function markDocumentSent(consultationId: string, documentId: string) {
  const consultation = getConsultation(consultationId);
  if (!consultation) return undefined;
  const doc = consultation.documentos.find((d) => d.id === documentId);
  if (!doc) return undefined;
  doc.enviado = true;
  doc.enviadoEn = new Date().toISOString();
  persist();
  return doc;
}

export function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function genToken() {
  // token largo, no predecible, para acceso a documentos sin exponer datos sensibles en la URL
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
}
