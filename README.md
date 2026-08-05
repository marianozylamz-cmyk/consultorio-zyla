# Consultorio Online — Dr. Juan Manuel Zyla

Plataforma de teleconsultas: el paciente elige horario, paga, entra a una videollamada de 15
minutos y recibe atención. El consultorio tradicional (WhatsApp, secretaria, recetas manuales)
sigue funcionando igual que siempre — esto es un canal adicional, no un reemplazo.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

Por defecto corre en **modo mock**: pagos con botones de simulación, mails logueados por consola.
Para activar las integraciones reales, copiá `.env.example` a `.env.local` y completá lo que
corresponda (ver detalle de cada una más abajo).

## Resumen de la última auditoría — de demo a MVP real

### 🚨 Corregido: el bug de fechas/horarios
El problema real era que `lib/availability.ts` calculaba todo (qué día es hoy, si estamos dentro
del horario 17–19hs, qué slots mostrar) usando `date.getHours()`, `date.getDay()` y
`toISOString()` directo. Esos métodos devuelven la hora en el **timezone del proceso de Node**,
no en el de Argentina. En tu máquina local puede coincidir "de casualidad" si tu compu está en
horario ARG, pero en cualquier hosting real (Vercel corre en UTC por defecto) esto se desfasa 3
horas — el horario 17–19hs deja de ser 17–19hs de Olavarría. Ahora todo pasa por
`Intl.DateTimeFormat` con `timeZone: "America/Argentina/Buenos_Aires"` fijo (Argentina no tiene
horario de verano desde 2009, así que UTC-3 es siempre correcto, sin lógica adicional). Se
corrigió en `lib/availability.ts`, `app/api/availability/route.ts` y
`app/api/availability/upcoming/route.ts`. Verificado con un servidor forzado a `TZ=UTC` (para
simular un hosting real) contra la API.

### Certificados médicos — nuevo
Botón **"Crear certificado"** en `/admin/consulta/[id]` (visible cuando la consulta está lista,
en curso o finalizada). Abre un modal con los datos automáticos (paciente, DNI, médico,
modalidad virtual) y los que completa Juan (motivo, diagnóstico, tratamiento, período de
invalidez laboral, destinatario, observaciones). Genera un PDF real con `pdf-lib`
(`lib/certificatePdf.ts`) y lo suma al mismo circuito de documentos que ya existía — mismo botón
"Enviar por mail" de siempre. No es un sistema de recetas (eso sigue fuera de alcance,
intencionalmente).

**Importante:** `doctorProfile.matricula` quedó en `null` a propósito. No se puede inventar un
número de matrícula real — la plataforma bloquea la generación de certificados (tanto en el
servidor como en la UI del modal) hasta que se cargue ese dato en `data/doctorProfile.ts`.

### Solicitud de receta a secretaría — nuevo
Botón en `/admin/consulta/[id]` que abre un modal (medicamento + indicaciones), arma un mensaje
de WhatsApp con los datos del paciente ya completos, y lo abre para mandarlo directo a
secretaría. Cero automatización real — la secretaría sigue laburando manual, como pediste.

### Contacto del consultorio — actualizado
Se sacaron los botones de WhatsApp/email dinámicos de la landing. Ahora muestra los datos fijos
del consultorio: llamadas al **480000** y WhatsApp al **2284479009**
(`data/doctorProfile.ts` → `consultorio.telefono` / `consultorio.whatsapp`). El mail interno
donde le llegan a Juan las alertas de "nueva consulta" quedó separado en
`contacto.emailNotificaciones` — ese nunca se muestra públicamente.

### Preparado para multi-profesional (liviano, sin sobreconstruir)
Cada consulta ahora guarda `doctorId`. No se armó routing por médico ni multi-tenant completo
(eso sigue siendo prematuro para un solo médico), pero el modelo de datos ya no asume "un solo
médico para siempre".

### Limpieza
Se eliminaron `app/documentos/[token]` y `app/api/documents/[token]` — quedaban de un enfoque
anterior (documentos por link) que se descartó a favor de mandar el archivo adjunto directo por
mail. Estaban rotos (referenciaban un campo `token` que ya no existe en el modelo) y no se
usaban desde ningún lado.

## Integraciones reales — cómo activarlas

### Mercado Pago (Checkout Pro)
1. Conseguí el Access Token en [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel) (arrancá con el de prueba).
2. Poné `MERCADOPAGO_ACCESS_TOKEN` en `.env.local`.
3. Para que el webhook funcione en local, necesitás una URL pública — usá [ngrok](https://ngrok.com) (`ngrok http 3000`) y poné esa URL en `APP_BASE_URL`.
4. Con eso configurado, el botón "Pagar y solicitar consulta" redirige al checkout real de Mercado Pago en vez de mostrar los botones de demo. `MERCADOPAGO_ENV=production` cuando uses el Access Token real (no el de prueba).
5. El webhook (`app/api/mp/webhook`) es la única fuente de verdad del pago — nunca se confía en los parámetros de la redirección del navegador, que se pueden falsificar.

### Videollamada (Jitsi Meet)
Ya anda sin configuración: usa el servidor público `meet.jit.si`, gratis. La sala se genera con
un identificador largo y aleatorio por consulta (no es adivinable), así que no hace falta
contraseña adicional. Pensado mobile-first: sin prejoin page, sin marca de agua de Jitsi, entra
directo a la llamada. Si más adelante hace falta más control (grabación, marca propia), se migra
a un Jitsi auto-alojado o a Daily.co tocando solo `services/videoCallService.ts`.

### Mails reales (SMTP)
1. Completá `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` en `.env.local` (por ejemplo con el SMTP de Hostinger que ya usás en MiPerfil.ar).
2. Con eso, la notificación de "nueva consulta" a Juan y el envío del documento al paciente (adjunto directo, sin link intermedio) salen por mail real.

## Recorrido sugerido

1. Entrá a `/` — landing pública del Dr. Zyla.
2. Click en **"Quiero una consulta"** → completá tus datos → elegí día y horario → **"Pagar y solicitar consulta"**.
3. Al pagar, caés en la **sala de espera** (`/consulta/[id]/espera`).
4. Abrí **otra pestaña** en `/admin` — vas a ver la alerta 🔔 **NUEVA CONSULTA**.
5. Click en **Atender**. Volvé a la pestaña del paciente: ahora puede entrar a la videollamada.
6. Entrá a la videollamada real (Jitsi Meet embebido) desde cualquiera de las dos pestañas y **finalizá la consulta**.
7. En `/admin`, entrá al detalle de esa consulta:
   - **"Crear certificado"** → completá el modal → se genera el PDF → **"Enviar por mail"**.
   - **"Solicitar receta a secretaría"** → completá medicamento/indicaciones → se abre WhatsApp con el mensaje armado.

## Qué es real y qué sigue simulado

| Servicio | Estado | Detalle |
|---|---|---|
| `lib/store.ts` | **Real** | Supabase es la única fuente de verdad — ver sección "Persistencia" abajo. |
| `lib/mercadopago.ts` | **Real** (con Access Token) | Checkout Pro: preferencia + webhook. Sin token configurado, cae a botones de demo. |
| `lib/email.ts` | **Real** (con SMTP configurado) | Nodemailer. Notifica al médico y envía documentos/certificados como adjunto directo. Sin SMTP, loguea por consola. |
| `lib/certificatePdf.ts` | **Real** | PDF generado en el momento con `pdf-lib`. Bloqueado hasta cargar `doctorProfile.matricula`. |
| `services/notificationService.ts` (WhatsApp) | Simulado | Necesita la WhatsApp Business API oficial (Meta Cloud API o Twilio/360dialog) con plantilla pre-aprobada por Meta — no se puede activar solo con código. |
| `services/documentService.ts` (almacenamiento del archivo) | Real, pero de paso | El PDF/imagen se guarda en base64 dentro de la columna `documentos` (jsonb) de la consulta en Supabase. Funciona, pero para volumen alto o archivos grandes conviene migrar a Supabase Storage — ver "Mejoras recomendadas". |

> Nota: la sección de videollamada de este README puede estar desactualizada respecto al código
> actual (se simplificó a un link fijo de Google Meet en `doctorProfile.videollamadaUrl` en algún
> punto). No se tocó en esta ronda, que se enfocó exclusivamente en la migración de persistencia.

## Persistencia — Supabase

Ya no hay `.localdb`, `lib/persistence.ts` ni estado en memoria. Todo pasa por `lib/store.ts`,
que ahora es 100% async y habla directo con Supabase.

**Variables de entorno necesarias** (ver `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` — la misma URL de proyecto que ya tenías configurada.
- `SUPABASE_SERVICE_ROLE_KEY` — **nueva**, hay que agregarla. Se consigue en Supabase →
  Project Settings → API → `service_role` (la secreta, no la `anon`). Se usa server-side
  únicamente — nunca llega al navegador.

**Tablas:**
- `availability` — ya existía tal cual la tenías (id, activo, horario_semanal, excepciones,
  updated_at), no se tocó. Siempre se lee/escribe la fila `id=1`.
- `consultations` — el esquema que asume el código está en `supabase/migration.sql`. Se diseñó
  siguiendo el mismo patrón que `availability` (columnas planas para lo que se filtra, `jsonb`
  para lo anidado). **Si tu tabla real tiene otra estructura, avisá** — los únicos lugares que
  conocen los nombres de columna son las funciones `rowToConsultation` /
  `consultationToInsertRow` / `partialConsultationToRow` en `lib/store.ts`.

**Importante:** esta migración se armó y se verificó por build + revisión de código (sin acceso
de red a Supabase desde este entorno de trabajo). No se pudo hacer una prueba real de
lectura/escritura contra tu proyecto — probalo vos localmente con `.env.local` apuntando a tus
credenciales reales antes de deployar a Vercel.

## Lo más importante que sigue faltando (fuera de esta ronda)

**`/admin` no tiene ningún login.** Cualquiera que sepa la URL entra directo a ver datos de
pacientes (nombre, DNI, WhatsApp, email) y puede tocar la disponibilidad. Esto hay que
resolverlo antes de usar la plataforma con pacientes reales — no hace falta un sistema de roles
complejo, alcanza con usuario/contraseña único para Juan.

~~Persistencia en Vercel~~ — resuelto en esta ronda: Supabase es la única fuente de verdad, ya
no se pierden datos entre despliegues.

Otros pendientes conocidos, en orden de importancia: choque de turnos (dos personas pueden
reservar el mismo horario), consulta que se cuelga para siempre si el paciente no aparece o Juan
no atiende, verificación de firma del webhook de Mercado Pago, rate limiting en las APIs
públicas, los legales básicos (términos y condiciones, consentimiento de telemedicina), y migrar
los documentos/certificados de base64-en-jsonb a Supabase Storage si el volumen crece.

## Estructura

```
app/                              páginas (App Router) + rutas de API
  admin/                            panel del médico
  consulta/                         flujo del paciente
  api/
    consultations/[id]/checkout/    inicia pago (real o mock)
    consultations/[id]/certificado/ genera certificado PDF
    mp/webhook/                     confirma pagos de Mercado Pago
components/                       UI compartida (modales, video, iconos)
services/                         capas de servicio reemplazables (pago, notificaciones, video, documentos)
lib/                              store (Supabase) + disponibilidad (timezone-safe) + Mercado Pago + email + certificados
supabase/migration.sql            esquema de referencia de la tabla `consultations`
types/                            tipos centrales del dominio
data/doctorProfile.ts             configuración central del médico (pensado para multi-médico a futuro)
```

## Fuera de alcance de este MVP (a propósito)

Sin login de paciente, sin historia clínica, sin sistema de recetas propio (Juan ya tiene el
suyo, y sigue trabajando manual vía secretaría), sin facturación, sin múltiples médicos en la
UI, sin marketplace.
