'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { AvailabilityStatus } from '@/components/AvailabilityStatus';
import { PulseDivider } from '@/components/PulseDivider';
import { HowItWorks } from '@/components/HowItWorks';
import { ServiciosGrid } from '@/components/ServiciosGrid';
import {
  IconPin,
  IconPhone,
  IconClock,
  IconWhatsApp,
  IconVideo,
  IconCheck,
  IconStethoscope,
  IconSearch,
} from '@/components/icons';
import { doctorProfile } from '@/data/doctorProfile';
import { HorarioResumen } from '@/components/HorarioResumen';
import { linkWhatsAppConsultorio } from '@/lib/whatsapp';

export default function LandingPage() {
  const d = doctorProfile;
  const precioFormateado = d.consultaOnline.precio.toLocaleString('es-AR');

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* ===== HERO ===== */}
      <section className="container-max pb-16 pt-12 sm:pb-20 sm:pt-20 md:pt-24">
        <div className="animate-fadeIn">
          {/* Ubicación */}
          <p className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-[#1B6E5C] sm:mb-6">
            <IconPin className="h-4 w-4 shrink-0" />
            {d.ciudad}, {d.provincia}
          </p>

          {/* Titulo principal */}
          <h1
            className="text-4xl font-bold leading-[1.1] tracking-tight text-[#2C3E50] 
              sm:text-5xl md:text-6xl"
          >
            {d.nombre}
          </h1>

          {/* Subtítulo */}
          <p className="mt-3 text-lg font-semibold text-[#1B6E5C] sm:text-xl">
            {d.especialidad}
          </p>

          {/* Descripción */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:mt-8 md:text-xl">
            Consultas médicas online, estés donde estés. Hablá con el Dr. Juan Manuel Zyla desde
            la comodidad de tu casa, sin turnos ni traslados.
          </p>

          {/* CTAs principales */}
          <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/consulta"
              className="btn-primary w-full sm:w-auto text-center font-semibold"
            >
              Agendar consulta ahora
            </Link>
            <Link href="#como-funciona" className="btn-secondary w-full sm:w-auto text-center">
              Ver cómo funciona
            </Link>
          </div>

          {/* Tarjeta de consulta online */}
          <div
            id="consultas-online"
            className="card mt-14 w-full animate-fadeIn sm:mt-16 sm:max-w-2xl"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted mb-2">
                  <IconVideo className="h-3.5 w-3.5 text-[#1B6E5C]" />
                  Consultas Online
                </p>
                <p className="text-sm text-muted">Todos los días</p>
                <p className="text-2xl font-bold text-[#2C3E50] mt-1">
                  {d.consultaOnline.duracionMinutos} minutos
                </p>
              </div>
              <AvailabilityStatus compact />
            </div>

            <div className="border-t border-[#E5E9F0] pt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase text-muted mb-2">
                  Horario
                </p>
                <HorarioResumen />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted mb-2">Tarifa</p>
                <p className="text-3xl font-bold text-[#2C3E50]">${precioFormateado}</p>
              </div>
            </div>

            <Link
              href="/consulta"
              className="btn-primary mt-6 w-full justify-center font-semibold"
            >
              Reservar ahora
            </Link>
          </div>
        </div>
      </section>

      <PulseDivider />

      {/* ===== CÓMO FUNCIONA ===== */}
      <HowItWorks />

      {/* ===== SOBRE MÍ ===== */}
      <section id="sobre-mi" className="container-max section-spacing">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
            Quién te atiende
          </p>
          <h2 className="mb-6 text-3xl font-bold text-[#2C3E50] md:text-4xl">
            Sobre mí
          </h2>
          <p className="text-lg leading-relaxed text-[#172033]">
            {d.sobreMi}
          </p>
          <a
            href="https://miperfil.ar/perfiles/jmzyla/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1B6E5C] transition-colors hover:text-[#155245]"
          >
            <IconSearch className="h-4 w-4 shrink-0" />
            Ver perfil profesional en MiPerfil.ar
          </a>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <ServiciosGrid />

      {/* ===== CONSULTORIO PRESENCIAL ===== */}
      <section className="container-max section-spacing">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
          Atención presencial
        </p>
        <h2 className="mb-8 text-3xl font-bold text-[#2C3E50] md:text-4xl">
          Consultorio en Olavarría
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="mb-2 text-lg font-bold text-[#2C3E50]">
              {d.consultorio.nombre}
            </div>
            <div className="mb-4 flex items-start gap-2 text-[15px] text-muted">
              <IconPin className="h-5 w-5 text-[#1B6E5C] shrink-0 mt-0.5" />
              <span>{d.consultorio.direccion}</span>
            </div>
            <div className="flex items-start gap-2 text-[15px] text-[#172033]">
              <IconClock className="h-5 w-5 text-[#1B6E5C] shrink-0 mt-0.5" />
              <span>{d.consultorio.horario}</span>
            </div>
          </div>

          <div className="card">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
              Contacto
            </p>
            <div className="space-y-3">
              <a
                href={`tel:${d.consultorio.telefono}`}
                className="flex items-center gap-3 rounded-lg hover:bg-[#F4EFE4] p-2 transition-colors"
              >
                <IconPhone className="h-5 w-5 text-[#1B6E5C] shrink-0" />
                <span className="font-semibold text-[#2C3E50]">{d.consultorio.telefono}</span>
              </a>
              <a
                href={linkWhatsAppConsultorio('Hola, tengo una consulta.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg hover:bg-[#F4EFE4] p-2 transition-colors"
              >
                <IconWhatsApp className="h-5 w-5 text-[#1B6E5C] shrink-0" />
                <span className="font-semibold text-[#2C3E50]">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <section className="border-t border-[#E5E9F0] bg-[#F4EFE4] py-12 md:py-16">
        <div className="container-max">
          <div className="grid gap-8 sm:grid-cols-3 mb-8">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted mb-3">
                <IconClock className="h-3.5 w-3.5 text-[#1B6E5C]" />
                Rápido
              </p>
              <p className="text-sm text-[#172033]">
                Reservá en segundos sin crear cuenta ni pasar por trámites.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted mb-3">
                <IconCheck className="h-3.5 w-3.5 text-[#1B6E5C]" />
                Seguro
              </p>
              <p className="text-sm text-[#172033]">
                Pago gestionado por Mercado Pago, con todos los medios disponibles.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted mb-3">
                <IconStethoscope className="h-3.5 w-3.5 text-[#1B6E5C]" />
                Documentado
              </p>
              <p className="text-sm text-[#172033]">
                Sala privada y certificados de la consulta cuando corresponda.
              </p>
            </div>
          </div>

          <div className="border-t border-[#E5E9F0] pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2C3E50]">Dr. {d.nombre}</p>
                <p className="text-xs text-muted">{d.especialidad}</p>
              </div>
              <p className="text-xs text-muted">
                © {new Date().getFullYear()} Consultorio Online. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}