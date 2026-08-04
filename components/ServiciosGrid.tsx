import {
  IconStethoscope,
  IconBriefcaseMedical,
  IconDocumentCheck,
  IconCalendarCheck,
  IconClipboardSearch,
} from "@/components/icons";
import { doctorProfile } from "@/data/doctorProfile";

// Mapeo de cada servicio del brief a un ícono + una micro-descripción humana.
// Si mañana se agrega o cambia un servicio en doctorProfile.servicios sin
// entrada acá, cae a un ícono e descripción genéricos (ver fallback abajo).
const DETALLE: Record<string, { icon: typeof IconStethoscope; texto: string }> = {
  "Medicina Clínica": {
    icon: IconStethoscope,
    texto: "Consultas generales, seguimiento y diagnóstico.",
  },
  "Medicina Laboral": {
    icon: IconBriefcaseMedical,
    texto: "Evaluaciones y certificaciones para empresas.",
  },
  "Licencias Médicas del Personal Docente y No Docente de la Provincia de Buenos Aires": {
    icon: IconDocumentCheck,
    texto: "Trámites de licencia para personal educativo.",
  },
  "Control de Ausentismo": {
    icon: IconCalendarCheck,
    texto: "Seguimiento de inasistencias laborales.",
  },
  "Pericias Médicas": {
    icon: IconClipboardSearch,
    texto: "Informes y evaluaciones periciales.",
  },
};

const FALLBACK = { icon: IconStethoscope, texto: "" };

export function ServiciosGrid() {
  return (
    <section id="servicios" className="border-t border-line bg-bgsoft py-20">
      <div className="mx-auto max-w-5xl px-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy/50">Áreas de atención</p>
        <h2 className="mb-10 text-2xl font-semibold text-ink md:text-3xl">Servicios</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {doctorProfile.servicios.map((servicio) => {
            const { icon: Icon, texto } = DETALLE[servicio] ?? FALLBACK;
            return (
              <div
                key={servicio}
                className="group rounded-xl2 border border-line bg-white p-5 transition-colors hover:border-navy/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-skyfaint text-navy transition-colors group-hover:bg-navy group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-[15px] font-medium leading-snug text-ink">{servicio}</h3>
                {texto && <p className="text-sm text-muted">{texto}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
