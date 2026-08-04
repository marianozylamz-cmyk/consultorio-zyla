import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { AvailabilityStatus } from "@/components/AvailabilityStatus";
import { PulseDivider } from "@/components/PulseDivider";
import { HowItWorks } from "@/components/HowItWorks";
import { ServiciosGrid } from "@/components/ServiciosGrid";
import { IconPin, IconPhone } from "@/components/icons";
import { doctorProfile } from "@/data/doctorProfile";

export default function LandingPage() {
  const d = doctorProfile;
  const precioFormateado = d.consultaOnline.precio.toLocaleString("es-AR");
  const iniciales = d.nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pb-20 sm:pt-20 md:pt-24">
        <div className="animate-fadeIn">
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-white sm:h-14 sm:w-14 sm:text-base">
              {iniciales}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <IconPin className="h-3.5 w-3.5 shrink-0" />
              {d.ciudad}, {d.provincia}
            </p>
          </div>

          <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
            {d.nombre}
          </h1>
          <p className="mt-3 text-base text-muted sm:text-lg md:text-xl">{d.especialidad}</p>

          <p className="mt-7 max-w-xl text-xl leading-snug text-ink sm:mt-8 md:text-2xl">
            Hablá con tu médico desde tu casa.
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Consulta médica online de {d.consultaOnline.duracionMinutos} minutos, sin salir de tu casa
            ni sacar turno con anticipación.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/consulta" className="btn-primary w-full sm:w-auto">
              Quiero una consulta
            </Link>
            <Link href="#como-funciona" className="btn-secondary w-full sm:w-auto">
              Conocer más
            </Link>
          </div>
        </div>

        {/* Tarjeta de consulta online */}
        <div id="consultas-online" className="card mt-12 w-full animate-fadeIn sm:mt-16 sm:max-w-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Consultas online
            </span>
            <AvailabilityStatus compact />
          </div>
          <div className="mb-1 text-sm text-ink">Todos los días</div>
          <div className="mb-5 text-2xl font-semibold text-navy">17:00 a 19:00 hs.</div>
          <div className="flex items-end justify-between border-t border-line pt-5">
            <div>
              <div className="text-3xl font-semibold text-ink">${precioFormateado}</div>
              <div className="text-sm text-muted">{d.consultaOnline.duracionMinutos} minutos</div>
            </div>
            <Link href="/consulta" className="btn-primary !py-2.5">
              Solicitar
            </Link>
          </div>
        </div>
      </section>

      <PulseDivider className="pb-2" />

      <HowItWorks />

      {/* SOBRE MI */}
      <section id="sobre-mi" className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy/50">Quién te atiende</p>
        <h2 className="mb-6 text-2xl font-semibold text-ink md:text-3xl">Sobre mí</h2>
        <p className="max-w-2xl text-[17px] leading-relaxed text-ink/90">{d.sobreMi}</p>
      </section>

      <ServiciosGrid />

      {/* CONSULTORIO */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-navy/50">Atención presencial</p>
        <h2 className="mb-6 text-2xl font-semibold text-ink md:text-3xl">Consultorio</h2>
        <div className="card max-w-md">
          <div className="mb-1 text-lg font-medium text-ink">{d.consultorio.nombre}</div>
          <div className="mb-4 text-[15px] text-muted">{d.consultorio.direccion}</div>
          <div className="text-[15px] text-ink/80">{d.consultorio.horario}</div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="border-t border-line py-12 sm:py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-medium text-ink">{d.nombre}</div>
            <div className="text-sm text-muted">{d.especialidad}</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={`tel:${d.consultorio.telefono}`} className="btn-secondary">
              <IconPhone className="mr-2 h-4 w-4" />
              Consultorio: {d.consultorio.telefono}
            </a>
            <a
              href={`https://wa.me/549${d.consultorio.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              WhatsApp: {d.consultorio.whatsapp}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
