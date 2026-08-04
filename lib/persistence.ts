import fs from "fs";
import path from "path";
import { AvailabilityConfig, Consultation } from "@/types";
import { defaultAvailability } from "@/data/doctorProfile";

// ==========================================================
// Persistencia simple a un archivo JSON local. Reemplaza al
// store puramente en memoria: ahora los datos sobreviven a
// reiniciar `npm run dev` o a que Next haga un rebuild.
//
// Es intencionalmente simple (sin motor de base de datos, sin
// dependencias nativas que compilar) porque para esta etapa del
// proyecto alcanza y sobra. El día que haga falta, se reemplaza
// este archivo por llamadas a Supabase/Postgres sin tocar
// lib/store.ts ni el resto de la app, que solo conocen
// loadData()/saveData().
// ==========================================================

interface PersistedData {
  availability: AvailabilityConfig;
  consultations: Consultation[];
}

const DATA_DIR = path.join(process.cwd(), ".localdb");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function datosIniciales(): PersistedData {
  return {
    availability: JSON.parse(JSON.stringify(defaultAvailability)),
    consultations: [],
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadData(): PersistedData {
  ensureDataDir();

  if (!fs.existsSync(DATA_FILE)) {
    const initial = datosIniciales();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    // merge defensivo por si el archivo quedó de una versión anterior del schema
    return {
      availability: parsed.availability ?? datosIniciales().availability,
      consultations: parsed.consultations ?? [],
    };
  } catch (error) {
    console.error("[persistence] No se pudo leer .localdb/store.json, se recrea desde cero:", error);
    const initial = datosIniciales();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export function saveData(data: PersistedData) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
