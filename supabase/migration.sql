-- ==========================================================
-- Esquema asumido para la tabla `consultations`.
--
-- Si tu tabla `consultations` YA existe con otros nombres de
-- columna, avisá y se ajustan los mappers en lib/store.ts —
-- es la única sección del código que conoce estos nombres.
-- ==========================================================

-- ==========================================================
-- `availability` — cambio de esquema: activo -> activo_desde
--
-- Correr esto A MANO en el SQL Editor de Supabase antes de
-- deployar el código nuevo (lib/store.ts ya lee/escribe
-- `activo_desde`, no `activo`).
--
-- Por qué: `activo` era un booleano suelto sin fecha — una vez
-- prendido, no había forma de saber si correspondía a HOY o
-- había quedado pegado de otro día (ese fue el bug de
-- "Disponible ahora" en días marcados como no laborables).
-- `activo_desde` guarda la fecha en que se activó "Atender
-- ahora"; el código considera vigente el interruptor solo si esa
-- fecha es la de hoy — se "vence" solo a la medianoche.
--
-- La columna vieja `activo` se deja en la tabla sin tocar (no se
-- dropea) por las dudas — el código ya no la lee ni la escribe.
alter table availability add column if not exists activo_desde date;

-- Backfill: si `activo` estaba en true, la mejor estimación
-- disponible es asumir que se activó hoy.
update availability
   set activo_desde = current_date
 where activo = true
   and activo_desde is null;
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

-- ==========================================================
-- `consultations.es_ahora` — distingue un turno agendado (recibe
-- mail de confirmación con fecha/hora) de una atención inmediata
-- por "Atender ahora" (el paciente ya está esperando en el momento,
-- no hace falta mandarle mail confirmando algo que ya está viendo
-- en pantalla).
--
-- Correr a mano en el SQL Editor de Supabase.
alter table consultations add column if not exists es_ahora boolean not null default false;

-- ==========================================================
-- `consultations.recordatorio_enviado_at` — timestamp (no boolean)
-- a propósito: además de marcar "ya se mandó", sirve como traba
-- atómica para el cron de recordatorios (ver
-- lib/store.ts:reclamarRecordatorio). El endpoint hace
-- `update ... where recordatorio_enviado_at is null`, así que si
-- GitHub Actions llega a correr el job dos veces pisado, la segunda
-- corrida encuentra la fila ya tomada y no reintenta el envío —
-- sin esto (con un booleano seteado recién después de enviar)
-- quedaría una ventana de carrera real.
--
-- Correr a mano en el SQL Editor de Supabase.
alter table consultations add column if not exists recordatorio_enviado_at timestamptz;

-- ==========================================================
-- `consultations.documentacion_enviada_at` — se manda UN SOLO mail al
-- paciente con todos los documentos disponibles (certificado,
-- observaciones, receta/indicaciones subidas), no uno por documento.
-- Este timestamp marca que ya se mandó, para no reenviar por accidente
-- y para poder mostrar "✓ Documentación enviada" en el panel.
--
-- Correr a mano en el SQL Editor de Supabase.
alter table consultations add column if not exists documentacion_enviada_at timestamptz;

-- ==========================================================
-- `consultations.receta_externa_url` — link a la receta que el médico
-- generó a mano en un sistema externo (ej. MisRx). Esta app NO genera
-- ni valida esa receta, solo guarda el link para no perderlo y poder
-- reenviárselo al paciente. Sin dominio fijo a propósito: si el día de
-- mañana cambian de proveedor, sigue funcionando igual.
--
-- Correr a mano en el SQL Editor de Supabase.
alter table consultations add column if not exists receta_externa_url text;
