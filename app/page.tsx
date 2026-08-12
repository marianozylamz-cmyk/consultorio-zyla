'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { AvailabilityStatus } from '@/components/AvailabilityStatus';
import { PulseDivider } from '@/components/PulseDivider';
import { HowItWorks } from '@/components/HowItWorks';
import { ServiciosGrid } from '@/components/ServiciosGrid';
import { IconPin, IconPhone, IconClock } from '@/components/icons';
import { doctorProfile } from '@/data/doctorProfile';
import { HorarioResumen } from '@/components/HorarioResumen';

export default function LandingPage() {
  const d = doctorProfile;
  const precioFormateado = d.consultaOnline.precio.toLocaleString('es-AR');
  const iniciales = d.nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      {/* ===== HERO ===== */}
      <section className="container-max pb-16 pt-12 sm:pb-20 sm:pt-20 md:pt-24">
        <div className="animate-fadeIn">
          {/* Avatar + Ubicación */}
          <div className="mb-8 flex items-center gap-4 sm:mb-10">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full 
                bg-gradient-to-br from-[#1B6E5C] to-[#155245] text-[15px] font-bold text-white 
                shadow-card sm:h-16 sm:w-16 sm:text-base"
            >
              {iniciales}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#2C3E50]">
                <IconPin className="h-4 w-4 text-[#1B6E5C] shrink-0" />
                {d.ciudad}, {d.provincia}
              </p>
              <p className="text-xs text-[#7A8499] mt-1">Disponible para consultas online</p>
            </div>
          </div>

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
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#7A8499] sm:mt-8 md:text-xl">
            Consultas médicas online sin salir de casa. Desde tu dispositivo, en segundos, hablá
            cara a cara con un especialista en medicina clínica.
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
                <p className="text-xs font-bold uppercase tracking-widest text-[#7A8499] mb-2">
                  💻 Consultas Online
                </p>
                <p className="text-sm text-[#7A8499]">Todos los días</p>
                <p className="text-2xl font-bold text-[#2C3E50] mt-1">
                  {d.consultaOnline.duracionMinutos} minutos
                </p>
              </div>
              <AvailabilityStatus compact />
            </div>

            <div className="border-t border-[#E5E9F0] pt-6 grid grid-cols-2 gap-6">
 <div>
                <p className="text-xs font-semibold uppercase text-[#7A8499] mb-2">
                  Horario
                </p>
                <HorarioResumen />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#7A8499] mb-2">Tarifa</p>
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
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7A8499]">
            Quién te atiende
          </p>
          <h2 className="mb-6 text-3xl font-bold text-[#2C3E50] md:text-4xl">
            Sobre mí
          </h2>
          <p className="text-lg leading-relaxed text-[#172033]">
            {d.sobreMi}
          </p>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <ServiciosGrid />

      {/* ===== CONSULTORIO PRESENCIAL ===== */}
      <section className="container-max section-spacing">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7A8499]">
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
            <div className="mb-4 flex items-start gap-2 text-[15px] text-[#7A8499]">
              <IconPin className="h-5 w-5 text-[#1B6E5C] shrink-0 mt-0.5" />
              <span>{d.consultorio.direccion}</span>
            </div>
            <div className="flex items-start gap-2 text-[15px] text-[#172033]">
              <IconClock className="h-5 w-5 text-[#1B6E5C] shrink-0 mt-0.5" />
              <span>{d.consultorio.horario}</span>
            </div>
          </div>

          <div className="card">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#7A8499]">
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
                href={`https://wa.me/549${d.consultorio.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg hover:bg-[#F4EFE4] p-2 transition-colors"
              >
                <svg className="h-5 w-5 text-[#1B6E5C] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.6 6.4c-1.4-1.4-3.3-2.2-5.3-2.2-4.1 0-7.5 3.4-7.5 7.5 0 1.3.3 2.6.9 3.8L2.9 21.1l4.1-1.3c1.2.7 2.5 1 3.9 1h.1c4.1 0 7.5-3.4 7.5-7.5 0-2-0.8-3.9-2.2-5.3zm-5.3 11.9h-.1c-1.2 0-2.4-0.3-3.4-1l-0.2-0.1-2.3 0.7 0.7-2.2-0.2-0.2c-0.8-1.1-1.2-2.4-1.2-3.8 0-3.4 2.8-6.2 6.2-6.2 1.7 0 3.2 0.6 4.4 1.8 1.2 1.2 1.8 2.7 1.8 4.4 0 3.4-2.8 6.2-6.2 6.2zm3.5-4.7c-0.2-0.1-1.1-0.5-1.3-0.6-0.2-0.1-0.4-0.1-0.6 0.1-0.2 0.3-0.8 0.9-1 1.1-0.2 0.2-0.3 0.2-0.5 0.1-0.2-0.1-0.9-0.3-1.7-1-0.6-0.6-1-1.3-1.1-1.5-0.1-0.2 0-0.3 0.1-0.4 0.1-0.1 0.3-0.3 0.4-0.5 0.1-0.2 0.1-0.3 0.2-0.5 0.1-0.2 0-0.3-0.1-0.4 0-0.1-0.6-1.4-0.8-1.9-0.2-0.4-0.4-0.4-0.6-0.4h-0.5c-0.2 0-0.4 0.1-0.6 0.3-0.2 0.2-0.8 0.8-0.8 1.9s0.9 2.2 1 2.4c0.1 0.2 1.5 2.3 3.6 3.2 0.5 0.2 0.9 0.3 1.2 0.4 0.5 0.1 1 0.1 1.4 0 0.4-0.1 1.1-0.4 1.3-0.9 0.2-0.5 0.2-0.9 0.1-1 0-0.1-0.2-0.3-0.4-0.4z" />
                </svg>
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
              <p className="text-xs font-bold uppercase tracking-widest text-[#7A8499] mb-3">
                🕐 Rápido
              </p>
              <p className="text-sm text-[#172033]">
                Reservá en segundos sin crear cuenta ni pasar por trámites.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#7A8499] mb-3">
                🔒 Seguro
              </p>
              <p className="text-sm text-[#172033]">
                Pago encriptado. Todos los medios. Tu privacidad protegida.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#7A8499] mb-3">
                🎯 Profesional
              </p>
              <p className="text-sm text-[#172033]">
                Médico especialista. Sala privada. Certificados incluidos.
              </p>
            </div>
          </div>

          <div className="border-t border-[#E5E9F0] pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2C3E50]">Dr. {d.nombre}</p>
                <p className="text-xs text-[#7A8499]">{d.especialidad}</p>
              </div>
              <p className="text-xs text-[#7A8499]">
                © {new Date().getFullYear()} Consultorio Online. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}