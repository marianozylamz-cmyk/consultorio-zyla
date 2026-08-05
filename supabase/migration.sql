-- ==========================================================
-- Esquema asumido para la tabla `consultations`.
-- La tabla `availability` ya existe tal cual la describiste (id,
-- activo, horario_semanal, excepciones, updated_at) y no se toca.
--
-- Si tu tabla `consultations` YA existe con otros nombres de
-- columna, avisá y se ajustan los mappers en lib/store.ts —
-- es la única sección del código que conoce estos nombres.
-- ==========================================================

create table if not exists consultations (
  id                 text primary key,
  doctor_id          text not null,
  paciente           jsonb not null,        -- { nombre, dni, whatsapp, email }
  fecha              date not null,
  hora               text not null,         -- "18:00"
  precio             numeric not null,
  duracion_minutos   integer not null,
  estado             text not null,         -- pendiente_pago | esperando | lista | en_consulta | finalizada | rechazada
  pago               jsonb not null,        -- { estado, metodo, fechaAprobacion?, mpPreferenceId?, mpPaymentId? }
  documentos         jsonb not null default '[]'::jsonb,
  notificaciones     jsonb not null default '[]'::jsonb,
  creada_en          timestamptz not null default now()
);

create index if not exists consultations_estado_idx on consultations (estado);
create index if not exists consultations_fecha_idx on consultations (fecha);
create index if not exists consultations_creada_en_idx on consultations (creada_en desc);
