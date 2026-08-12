'use client';

import { doctorProfile } from '@/data/doctorProfile';
import { IconClock, IconCard, IconVideo } from './icons';

interface Paso {
  numero: string;
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
}

const PASOS: Paso[] = [
  {
    numero: '01',
    icono: IconClock,
    titulo: 'Elegí tu horario',
    descripcion: `Consultá la disponibilidad en tiempo real. Si el Dr. está disponible ahora, ingresá en segundos. Si prefieres otro momento, elegí dentro de la próxima semana.`,
  },
  {
    numero: '02',
    icono: IconCard,
    titulo: 'Abonás en línea',
    descripcion: `El pago de $${doctorProfile.consultaOnline.precio.toLocaleString('es-AR')} se confirma antes de empezar. Todos los medios, totalmente seguro. Los ${doctorProfile.consultaOnline.duracionMinutos} minutos son exclusivos para vos.`,
  },
  {
    numero: '03',
    icono: IconVideo,
    titulo: 'Videollamada privada',
    descripcion: `Entrás a tu sala de video con un link personal. Después: receta, certificado e indicaciones por email. Todo documentado.`,
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-[#E5E9F0] bg-[#F4EFE4] section-spacing">
      <div className="container-max">
        {/* Encabezado */}
        <div className="mb-16 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7A8499]">
            El proceso
          </p>
          <h2 className="text-3xl font-bold text-[#2C3E50] md:text-4xl">
            ¿Cómo funciona?
          </h2>
          <p className="mt-4 text-[15px] text-[#7A8499] leading-relaxed">
            Desde que abrís la página hasta que empezás a hablar con el doctor: 3 pasos simples, sin
            complicaciones.
          </p>
        </div>

        {/* Grid de pasos */}
        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Línea conectora horizontal (desktop) */}
          <div
            className="absolute left-6 top-12 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-[#1B6E5C]/40 via-[#1B6E5C]/20 to-transparent md:block"
            aria-hidden="true"
          />

          {/* Línea conectora vertical (mobile) */}
          <div
            className="absolute left-6 top-12 block h-[calc(100%-3rem)] w-px bg-gradient-to-b from-[#1B6E5C]/40 to-transparent md:hidden"
            aria-hidden="true"
          />

          {PASOS.map((paso, idx) => {
            const Icon = paso.icono;

            return (
              <div
                key={paso.numero}
                className="relative pl-20 md:pl-0 animate-fadeIn"
                style={{
                  animationDelay: `${idx * 100}ms`,
                  animationFillMode: 'both',
                }}
              >
                {/* Círculo con ícono */}
                <div
                  className="absolute left-0 top-0 flex h-14 w-14 shrink-0 items-center justify-center rounded-full 
                    bg-gradient-to-br from-[#1B6E5C] to-[#155245] text-white shadow-card
                    md:static md:mb-8 transition-all duration-300 group-hover:shadow-hover"
                  role="img"
                  aria-label={`Paso ${paso.numero}`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Contenido */}
                <div className="md:card md:bg-transparent md:border-0 md:shadow-none md:p-0">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1B6E5C]/70 md:mb-4">
                    Paso {paso.numero}
                  </p>
                  <h3 className="mb-2 text-lg font-bold leading-snug text-[#2C3E50]">
                    {paso.titulo}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[#7A8499]">
                    {paso.descripcion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA secundario */}
        <div className="mt-16 rounded-2xl border-2 border-[#1B6E5C]/20 bg-white p-8 text-center md:p-12">
          <h3 className="mb-3 text-2xl font-bold text-[#2C3E50]">
            ¿Tenés dudas?
          </h3>
          <p className="mb-6 text-[15px] text-[#7A8499]">
            Escribinos por WhatsApp y te respondemos en minutos.
          </p>
          <a
            href={`https://wa.me/${doctorProfile.consultorio.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex gap-2"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.6 6.4c-1.4-1.4-3.3-2.2-5.3-2.2-4.1 0-7.5 3.4-7.5 7.5 0 1.3.3 2.6.9 3.8L2.9 21.1l4.1-1.3c1.2.7 2.5 1 3.9 1h.1c4.1 0 7.5-3.4 7.5-7.5 0-2-0.8-3.9-2.2-5.3zm-5.3 11.9h-.1c-1.2 0-2.4-0.3-3.4-1l-0.2-0.1-2.3 0.7 0.7-2.2-0.2-0.2c-0.8-1.1-1.2-2.4-1.2-3.8 0-3.4 2.8-6.2 6.2-6.2 1.7 0 3.2 0.6 4.4 1.8 1.2 1.2 1.8 2.7 1.8 4.4 0 3.4-2.8 6.2-6.2 6.2zm3.5-4.7c-0.2-0.1-1.1-0.5-1.3-0.6-0.2-0.1-0.4-0.1-0.6 0.1-0.2 0.3-0.8 0.9-1 1.1-0.2 0.2-0.3 0.2-0.5 0.1-0.2-0.1-0.9-0.3-1.7-1-0.6-0.6-1-1.3-1.1-1.5-0.1-0.2 0-0.3 0.1-0.4 0.1-0.1 0.3-0.3 0.4-0.5 0.1-0.2 0.1-0.3 0.2-0.5 0.1-0.2 0-0.3-0.1-0.4 0-0.1-0.6-1.4-0.8-1.9-0.2-0.4-0.4-0.4-0.6-0.4h-0.5c-0.2 0-0.4 0.1-0.6 0.3-0.2 0.2-0.8 0.8-0.8 1.9s0.9 2.2 1 2.4c0.1 0.2 1.5 2.3 3.6 3.2 0.5 0.2 0.9 0.3 1.2 0.4 0.5 0.1 1 0.1 1.4 0 0.4-0.1 1.1-0.4 1.3-0.9 0.2-0.5 0.2-0.9 0.1-1 0-0.1-0.2-0.3-0.4-0.4z" />
            </svg>
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}