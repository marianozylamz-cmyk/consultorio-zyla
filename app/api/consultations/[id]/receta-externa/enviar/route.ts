import { NextResponse } from "next/server";
import { getConsultation } from "@/lib/store";
import { errorDeServidor } from "@/lib/apiErrors";
import { emailConfigurado } from "@/lib/email";
import { notificationService } from "@/services/notificationService";

// Manda por mail al paciente el link a su receta externa (MisRx u otro),
// ya guardado previamente. Reusa el mismo enviarEmail() que certificados
// y documentación — no hay un sistema de mail paralelo.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const consultation = await getConsultation(params.id);
    if (!consultation) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
    }

    if (!consultation.recetaExternaUrl) {
      return NextResponse.json({ error: "Todavía no hay ningún link de receta guardado." }, { status: 400 });
    }

    if (!emailConfigurado()) {
      return NextResponse.json(
        { error: "El envío de mails no está configurado todavía (falta el SMTP)." },
        { status: 503 }
      );
    }

    const { enviado } = await notificationService.sendRecetaExternaLink(consultation);
    if (!enviado) {
      return NextResponse.json({ error: "No se pudo enviar el mail. Intentá nuevamente." }, { status: 502 });
    }

    return NextResponse.json({ enviado: true });
  } catch (error) {
    return errorDeServidor(error, "No se pudo enviar el link de la receta.");
  }
}
