const PREGUNTAS = [
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No, no hace falta usuario ni contraseña. Solo tus datos para la reserva.',
  },
  {
    q: '¿Necesito tener Mercado Pago?',
    a: 'No, podés pagar con tarjeta de crédito o débito sin tener cuenta de Mercado Pago.',
  },
  {
    q: '¿Cómo recibo la receta o el certificado?',
    a: 'Por email, después de la consulta.',
  },
  {
    q: '¿Puedo cambiar el día u horario de mi turno?',
    a: 'Sí, desde el link que te llega por mail al confirmar la reserva.',
  },
  {
    q: '¿Qué pasa si no puedo entrar a la videollamada?',
    a: 'Escribinos por WhatsApp y te ayudamos al toque.',
  },
];

export function FAQ() {
  return (
    <section className="border-t border-[#E5E9F0] bg-white !py-10">
      <div className="container-max max-w-2xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
          Preguntas frecuentes
        </p>
        <div className="divide-y divide-[#E5E9F0]">
          {PREGUNTAS.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#2C3E50]">
                {item.q}
                <span className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
