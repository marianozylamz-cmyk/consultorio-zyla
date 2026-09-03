import { SiteHeader } from '@/components/SiteHeader';
import { doctorProfile } from '@/data/doctorProfile';
import { linkWhatsAppConsultorio } from '@/lib/whatsapp';

export const metadata = {
  title: 'Términos y Condiciones — Consultorio Online',
};

const ULTIMA_ACTUALIZACION = '3 de septiembre de 2026';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-10 text-xl font-bold text-[#2C3E50] first:mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[15px] leading-relaxed text-[#172033]">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[#172033]">{children}</ul>;
}

export default function TerminosPage() {
  const d = doctorProfile;

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader fixed={false} />

      <article className="container-max max-w-3xl py-12 sm:py-16">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Legal</p>
        <h1 className="mb-2 text-3xl font-bold text-[#2C3E50] sm:text-4xl">
          Términos y Condiciones — Consultorio Online Dr. {d.nombre}
        </h1>
        <p className="mb-10 text-sm text-muted">Última actualización: {ULTIMA_ACTUALIZACION}</p>

        <H2>1. Qué es este servicio</H2>
        <P>
          Esta plataforma permite solicitar una consulta médica online con el Dr. {d.nombre} ({d.profesion},{' '}
          {d.especialidad}), mediante videollamada, previo pago.
        </P>
        <P>
          <strong>Este servicio NO reemplaza la atención presencial</strong> y no está diseñado para urgencias
          o emergencias médicas. Ante una emergencia, dirigirse al servicio de guardia o llamar al número de
          emergencias correspondiente.
        </P>

        <H2>2. Modalidad de la consulta</H2>
        <Ul>
          <li>
            La consulta se realiza por videollamada, con una duración estimada de {d.consultaOnline.duracionMinutos}{' '}
            minutos.
          </li>
          <li>
            Existen dos modalidades, con precios diferentes:
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {d.consultaOnline.tipos.map((t) => (
                <li key={t.id}>
                  <strong>{t.nombre}</strong>: {t.descripcion}
                </li>
              ))}
            </ul>
          </li>
          <li>El precio de cada modalidad se muestra antes de confirmar el pago.</li>
        </Ul>

        <H2>3. Pago</H2>
        <Ul>
          <li>El pago se realiza de forma anticipada, antes de acceder a la consulta, a través de Mercado Pago.</li>
          <li>
            En algunos casos, el pago puede confirmarse por otro medio (por ejemplo, transferencia bancaria o
            efectivo en el consultorio) a criterio del profesional.
          </li>
          <li>Los precios están expresados en pesos argentinos (ARS) e incluyen los impuestos que correspondan.</li>
        </Ul>

        <H2>4. Cancelaciones y reembolsos</H2>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Esta sección todavía no está confirmada — ver el mensaje del chat.
        </div>

        <H2>5. Consentimiento para la teleconsulta</H2>
        <P>Al solicitar una consulta online, el paciente declara que:</P>
        <Ul>
          <li>
            Comprende que se trata de una consulta médica a distancia, con las limitaciones propias de la
            modalidad (imposibilidad de examen físico directo).
          </li>
          <li>
            Los datos personales y de salud que proporcione (nombre, DNI, motivo de consulta, diagnóstico, fotos
            de credencial de obra social, etc.) serán utilizados exclusivamente para brindar la atención médica
            solicitada.
          </li>
          <li>
            Entiende que, según la evaluación del profesional, puede requerirse una derivación a consulta
            presencial.
          </li>
        </Ul>

        <H2>6. Datos personales</H2>
        <P>De acuerdo con la Ley N° 25.326 de Protección de Datos Personales:</P>
        <Ul>
          <li>
            Los datos que el paciente proporciona (incluyendo datos de salud) se recopilan con la única
            finalidad de brindar la atención médica solicitada y emitir la documentación correspondiente
            (certificados, solicitudes de estudios).
          </li>
          <li>
            Estos datos no se comparten con terceros, salvo requerimiento legal o para procesar el pago (Mercado
            Pago) y el envío de comunicaciones (proveedor de correo electrónico).
          </li>
          <li>
            El paciente puede solicitar en cualquier momento acceder, rectificar o solicitar la eliminación de
            sus datos personales, escribiendo a{' '}
            <a href={`mailto:${d.contacto.emailNotificaciones}`} className="text-navy hover:underline">
              {d.contacto.emailNotificaciones}
            </a>
            .
          </li>
          <li>
            La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, tiene la
            atribución de atender denuncias y reclamos que interpongan quienes resulten afectados en sus
            derechos por incumplimiento de las normas vigentes.
          </li>
        </Ul>

        <H2>7. Documentación médica emitida</H2>
        <Ul>
          <li>
            Los certificados y solicitudes de estudios generados a través de la plataforma tienen la misma
            validez que los emitidos en el consultorio presencial, y quedan firmados con los datos
            profesionales del médico (nombre, matrícula, especialidad).
          </li>
          <li>
            La plataforma <strong>no emite recetas médicas</strong> a través de un sistema propio — las recetas
            se gestionan por el sistema habitual del profesional.
          </li>
          <li>La documentación se envía por correo electrónico a la dirección que el paciente proporcionó al momento de la reserva.</li>
        </Ul>

        <H2>8. Responsabilidad</H2>
        <Ul>
          <li>
            El servicio brinda un canal de atención médica online, pero no garantiza disponibilidad
            ininterrumpida de la plataforma (pueden existir cortes de conexión, mantenimiento, u otros
            inconvenientes técnicos ajenos al profesional).
          </li>
          <li>
            Ante un problema técnico durante la consulta, se procurará resolver por otro medio (teléfono,
            reprogramación) sin costo adicional para el paciente.
          </li>
        </Ul>

        <H2>9. Contacto</H2>
        <P>
          Para consultas sobre estos términos, cancelaciones, o ejercicio de derechos sobre datos personales:
        </P>
        <Ul>
          <li>
            WhatsApp:{' '}
            <a href={linkWhatsAppConsultorio()} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
              {d.consultorio.whatsapp}
            </a>
          </li>
          <li>Teléfono: {d.consultorio.telefono}</li>
          <li>
            Email:{' '}
            <a href={`mailto:${d.contacto.emailNotificaciones}`} className="text-navy hover:underline">
              {d.contacto.emailNotificaciones}
            </a>
          </li>
        </Ul>
      </article>
    </main>
  );
}
