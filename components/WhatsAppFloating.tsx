'use client';

import { IconWhatsApp } from './icons';
import { linkWhatsAppConsultorio } from '@/lib/whatsapp';

export function WhatsAppFloating() {
  return (
    <a
      href={linkWhatsAppConsultorio('Hola, tengo una consulta.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B6E5C] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#155245]"
    >
      <IconWhatsApp className="h-7 w-7" />
    </a>
  );
}
