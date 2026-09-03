/**
 * Convierte un File a data URL (base64) del lado del cliente. Mismo
 * patrón para los documentos que sube el médico (admin) y las fotos de
 * credencial que sube el paciente (reserva) — un solo lugar, no dos
 * copias de la misma función.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
