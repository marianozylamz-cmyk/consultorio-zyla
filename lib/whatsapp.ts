import { doctorProfile } from "@/data/doctorProfile";

// ==========================================================
// Único lugar que arma links wa.me al WhatsApp del consultorio/
// secretaría. Antes cada componente lo armaba a mano y la mitad
// se olvidaba del prefijo "549" (código de país + el 9 que exige
// WhatsApp para celulares argentinos) — sin eso, wa.me/<número
// local> no abre ningún chat válido.
// ==========================================================

export function linkWhatsAppConsultorio(mensaje?: string): string {
  const base = `https://wa.me/549${doctorProfile.consultorio.whatsapp}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
