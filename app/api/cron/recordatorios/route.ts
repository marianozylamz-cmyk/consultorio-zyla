import { NextResponse } from "next/server";
import { listConsultationsParaRecordatorio, reclamarRecordatorio } from "@/lib/store";
import { fechaHoraDesdeISO } from "@/lib/availability";
import { notificationService } from "@/services/notificationService";
import { errorDeServidor } from "@/lib/apiErrors";

// Nunca cachear/pre-renderizar: cada corrida depende de la hora real y del estado en vivo de Supabase.
export const dynamic = "force-dynamic";

const UNA_HORA_MS = 60 * 60 * 1000;

// ==========================================================
// Dispara los recordatorios de turno (1 hora antes). Lo llama
// GitHub Actions cada 15 minutos (ver .github/workflows/recordatorios.yml),
// nunca un navegador ni el propio front — por eso exige el secret.
//
// Por qué no está protegido por el middleware de admin: ese Basic Auth es
// para un humano tipeando usuario/contraseña en el navegador; esto es
// máquina a máquina, así que usa su propio secret por Authorization Bearer.
// Falla cerrado si CRON_SECRET no está configurado.
// ==========================================================
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const ahora = new Date();
    const candidatas = await listConsultationsParaRecordatorio();

    const porMandar = candidatas.filter((c) => {
      const inicio = fechaHoraDesdeISO(c.fecha, c.hora);
      const faltan = inicio.getTime() - ahora.getTime();
      // Falta menos de 1 hora, pero el turno todavía no arrancó — si el job
      // estuvo caído y ya pasó la hora, no tiene sentido "recordar" algo
      // que ya empezó o ya quedó atrás.
      return faltan > 0 && faltan <= UNA_HORA_MS;
    });

    const resultados: { id: string; enviado: boolean }[] = [];

    for (const consulta of porMandar) {
      // Reclamo atómico: si otra corrida ya lo tomó, reclamarRecordatorio
      // devuelve undefined y no mandamos nada — así nunca se duplica.
      const reclamada = await reclamarRecordatorio(consulta.id);
      if (!reclamada) continue;

      try {
        const { enviado } = await notificationService.notifyPatientReminder(reclamada);
        resultados.push({ id: consulta.id, enviado });
      } catch (error) {
        console.error(`[cron/recordatorios] Falló el envío para la consulta ${consulta.id}:`, error);
        resultados.push({ id: consulta.id, enviado: false });
      }
    }

    return NextResponse.json({ evaluadas: candidatas.length, procesadas: resultados.length, resultados });
  } catch (error) {
    return errorDeServidor(error, "No se pudieron procesar los recordatorios.");
  }
}
