import { IconClock, IconCard, IconVideo } from "@/components/icons";
import { doctorProfile } from "@/data/doctorProfile";

const pasos = [
  {
    n: "01",
    icon: IconClock,
    t: "Elegís el momento",
    d: "Consultá ahora mismo si el Dr. Zyla está en línea, o elegí un horario dentro de la franja online. No hace falta turno con anticipación ni crear una cuenta.",
  },
  {
    n: "02",
    icon: IconCard,
    t: "Abonás antes de empezar",
    d: `El pago de $${doctorProfile.consultaOnline.precio.toLocaleString("es-AR")} se confirma antes de la consulta, así los ${doctorProfile.consultaOnline.duracionMinutos} minutos son exclusivamente tuyos, sin interrupciones.`,
  },
  {
    n: "03",
    icon: IconVideo,
    t: "Hablás cara a cara",
    d: "Ingresás a una sala de videollamada privada. Si hace falta receta, certificado o indicaciones, las recibís después por un enlace personal.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-line bg-bgsoft py-20">
      <div className="mx-auto max-w-5xl px-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy/50">El proceso</p>
        <h2 className="mb-14 text-2xl font-semibold text-ink md:text-3xl">¿Cómo funciona?</h2>

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Línea conectora: horizontal en desktop, vertical en mobile */}
          <div className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] bg-line md:block" />
          <div className="absolute left-6 top-6 block h-[calc(100%-3rem)] w-px bg-line md:hidden" />

          {pasos.map((paso) => {
            const Icon = paso.icon;
            return (
              <div key={paso.n} className="relative pl-16 md:pl-0">
                <div className="mb-5 flex items-center gap-4 md:flex-col md:items-start md:gap-5">
                  <div className="absolute left-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy shadow-card md:static">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-navy/40 md:mt-1">{paso.n}</span>
                </div>
                <div className="rounded-xl2 border border-line bg-white p-5">
                  <h3 className="mb-2 text-[17px] font-medium text-ink">{paso.t}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{paso.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
