// ==========================================================
// Integración real con Mercado Pago — Checkout Pro.
// Usamos la API REST directo (sin el SDK oficial) para no
// atarnos a una versión de paquete: son 2 llamadas simples.
//
// Requiere la variable de entorno MERCADOPAGO_ACCESS_TOKEN
// (Access Token de PRODUCCIÓN una vez que Juan tenga la cuenta
// de Mercado Pago vinculada; mientras tanto se puede usar el
// Access Token de PRUEBA que da el panel de Developers).
//
// Documentación: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
// ==========================================================

const MP_API = "https://api.mercadopago.com";

export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function getBaseUrl(): string {
  // En producción, configurar APP_BASE_URL con el dominio real (ej: https://juanzyla.com.ar).
  // En desarrollo local, Mercado Pago necesita una URL pública para el webhook —
  // usar ngrok (o similar) y poner esa URL acá mientras se prueba.
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

interface CrearPreferenciaInput {
  consultationId: string;
  titulo: string;
  precio: number;
}

interface PreferenciaMP {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export async function crearPreferenciaPago(input: CrearPreferenciaInput): Promise<PreferenciaMP> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado");

  const baseUrl = getBaseUrl();

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: input.titulo,
          quantity: 1,
          currency_id: "ARS",
          unit_price: input.precio,
        },
      ],
      external_reference: input.consultationId,
      back_urls: {
        success: `${baseUrl}/consulta/${input.consultationId}/espera`,
        pending: `${baseUrl}/consulta/${input.consultationId}/espera`,
        failure: `${baseUrl}/consulta`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/mp/webhook`,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Mercado Pago rechazó la creación de la preferencia: ${detalle}`);
  }

  return (await res.json()) as PreferenciaMP;
}

interface PagoMP {
  id: number;
  status: "approved" | "pending" | "rejected" | "in_process" | "cancelled" | "refunded" | string;
  external_reference: string;
}

export async function consultarPago(paymentId: string): Promise<PagoMP> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado");

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`No se pudo consultar el pago ${paymentId}: ${detalle}`);
  }

  return (await res.json()) as PagoMP;
}
