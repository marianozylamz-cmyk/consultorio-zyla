// ==========================================================
// Capa de pagos. Hoy: MockPaymentService.
// Mañana: crear MercadoPagoPaymentService que implemente la
// misma interfaz PaymentService y reemplazar la instancia
// exportada al final del archivo. El resto de la app llama
// siempre a `paymentService`, nunca a la implementación
// concreta, así el cambio es de una sola línea.
// ==========================================================

export interface PaymentResult {
  aprobado: boolean;
  referencia: string;
  fecha: string;
}

export interface PaymentService {
  procesarPago(input: { consultationId: string; monto: number; forzarResultado?: "aprobado" | "rechazado" }): Promise<PaymentResult>;
}

class MockPaymentService implements PaymentService {
  async procesarPago({
    consultationId,
    monto,
    forzarResultado,
  }: {
    consultationId: string;
    monto: number;
    forzarResultado?: "aprobado" | "rechazado";
  }): Promise<PaymentResult> {
    // Simula latencia de red de un checkout real
    await new Promise((r) => setTimeout(r, 600));

    const aprobado = forzarResultado ? forzarResultado === "aprobado" : true;

    return {
      aprobado,
      referencia: `MOCK-${consultationId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      fecha: new Date().toISOString(),
    };
  }
}

export const paymentService: PaymentService = new MockPaymentService();
