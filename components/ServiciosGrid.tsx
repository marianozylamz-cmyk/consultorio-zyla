'use client';

import {
  IconStethoscope,
  IconBriefcaseMedical,
  IconDocumentCheck,
  IconCalendarCheck,
  IconClipboardSearch,
  IconWhatsApp,
} from './icons';
import { doctorProfile } from '@/data/doctorProfile';
import { linkWhatsAppConsultorio } from '@/lib/whatsapp';

interface ServicioDetail {
  icono: React.ComponentType<{ className?: string }>;
  texto: string;
}

const DETALLE_SERVICIO: Record<string, ServicioDetail> = {
  'Medicina Clínica': {
    icono: IconStethoscope,
    texto:
      'Consultas generales, diagnóstico, seguimiento de pacientes y tratamiento de patologías médicas.',
  },
  'Medicina Laboral': {
    icono: IconBriefcaseMedical,
    texto:
      'Evaluaciones médicas laborales, certificaciones de aptitud y vigilancia de la salud en empresas.',
  },
  'Licencias Médicas del Personal Docente y No Docente de la Provincia de Buenos Aires': {
    icono: IconDocumentCheck,
    texto:
      'Gestión de licencias médicas, seguimiento y documentación para personal educativo provincial.',
  },
  'Control de Ausentismo': {
    icono: IconCalendarCheck,
    texto:
      'Seguimiento de inasistencias laborales, evaluación de incapacidad y reportes al empleador.',
  },
  'Pericias Médicas': {
    icono: IconClipboardSearch,
    texto:
      'Informes periciales, evaluaciones médico-legales y dictámenes para organismos e instituciones.',
  },
};

const DEFAULT_ICON = IconStethoscope;

export function ServiciosGrid() {
  const servicios = doctorProfile.servicios || [];

  return (
    <section id="servicios" className="border-t border-[#E5E9F0] bg-white section-spacing">
      <div className="container-max">
        {/* Encabezado */}
        <div className="mb-14 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
            Áreas de atención
          </p>
          <h2 className="text-3xl font-bold text-[#2C3E50] md:text-4xl">
            Servicios médicos
          </h2>
          <p className="mt-4 text-[15px] text-muted">
            Especialista en medicina clínica y laboral con experiencia en evaluaciones, certificaciones
            y pericias médicas.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((servicio, idx) => {
            const { icono: Icon, texto } = DETALLE_SERVICIO[servicio] || {
              icono: DEFAULT_ICON,
              texto: '',
            };

            return (
              <a
                key={servicio}
                href={linkWhatsAppConsultorio(`Hola, quiero más información sobre ${servicio}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group card hover-lift animate-fadeIn block"
                style={{
                  animationDelay: `${idx * 50}ms`,
                  animationFillMode: 'both',
                }}
              >
                {/* Ícono en fondo circular */}
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full
                    bg-[#E8EFF5] text-[#1B6E5C]
                    transition-all duration-300 group-hover:bg-[#1B6E5C] group-hover:text-white group-hover:shadow-lg"
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Título */}
                <h3 className="mb-2.5 text-[15px] font-bold leading-snug text-[#2C3E50] group-hover:text-[#1B6E5C] transition-colors">
                  {servicio}
                </h3>

                {/* Descripción */}
                {texto && (
                  <p className="text-sm leading-relaxed text-muted">
                    {texto}
                  </p>
                )}

                {/* Indicador de hover — ahora es un link real a WhatsApp, no decorativo */}
                <div className="mt-4 flex items-center gap-2 text-[#1B6E5C] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-xs font-semibold">Consultar por WhatsApp</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>

        {/* CTA secundario */}
        <div className="mt-16 rounded-2xl border-2 border-[#1B6E5C]/10 bg-gradient-to-r from-[#F4EFE4] to-[#E8EFF5] p-8 text-center md:p-12">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
            ¿Necesitás más información?
          </p>
          <h3 className="mb-4 text-2xl font-bold text-[#2C3E50]">
            Consultá tus dudas
          </h3>
          <p className="mb-6 max-w-lg mx-auto text-[15px] text-muted">
            Escribinos y te explicamos en detalle cómo podemos ayudarte o si necesitás derivación a
            otro especialista.
          </p>
          <a
            href={linkWhatsAppConsultorio('Hola, tengo una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex gap-2"
          >
            <IconWhatsApp className="h-5 w-5" />
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}