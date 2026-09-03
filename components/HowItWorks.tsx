'use client';

import { doctorProfile } from '@/data/doctorProfile';
import { IconClock, IconCard, IconVideo, IconWhatsApp } from './icons';
import { linkWhatsAppConsultorio } from '@/lib/whatsapp';

interface Paso {
  numero: string;
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
}

const PASOS: Paso[] = [
  {
    numero: '1',
    icono: IconClock,
    titulo: 'Elegí tu horario',
    descripcion: `Consultá la disponibilidad en tiempo real. Si el Dr. está disponible ahora, ingresá en segundos. Si prefieres otro momento, elegí dentro de la próxima semana.`,
  },
  {
    numero: '2',
    icono: IconCard,
    titulo: 'Abonás en línea',
    descripcion: `El pago se confirma antes de empezar, según el tipo de consulta que elijas. Todos los medios, totalmente seguro. Los ${doctorProfile.consultaOnline.duracionMinutos} minutos son exclusivos para vos.`,
  },
  {
    numero: '3',
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
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
            El proceso
          </p>
          <h2 className="text-3xl font-bold text-[#2C3E50] md:text-4xl">
            ¿Cómo funciona?
          </h2>
          <p className="mt-4 text-[15px] text-muted leading-relaxed">
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
                  <p className="text-[15px] leading-relaxed text-muted">
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
          <p className="mb-6 text-[15px] text-muted">
            Escribinos por WhatsApp y te respondemos en minutos.
          </p>
          <a
            href={linkWhatsAppConsultorio('Hola, tengo una duda sobre las consultas online.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex gap-2"
          >
            <IconWhatsApp className="h-5 w-5" />
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}