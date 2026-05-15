const DEFAULT_COUNTRY_CODE = '54'

export function normalizeWhatsAppPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) return digits
  return `${DEFAULT_COUNTRY_CODE}${digits}`
}

export function buildWhatsAppUrl(phone, message) {
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  if (!normalizedPhone) return ''
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(phone, message) {
  const url = buildWhatsAppUrl(phone, message)
  if (!url) {
    window.alert('El cliente no tiene un telefono valido para WhatsApp.')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function clientGreetingMessage(client) {
  return `Hola ${client.name}, te escribimos de NexTorqen.`
}

export function appointmentReminderMessage(appointment) {
  return [
    `Hola ${appointment.clientName}, te recordamos tu turno en NexTorqen.`,
    `Fecha: ${appointment.date}`,
    `Hora: ${appointment.time}`,
    `Vehiculo: ${appointment.vehicleLabel || '-'}`,
    `Motivo: ${appointment.reason}`,
    'Si necesitas cancelar o reprogramar, respondemos por este medio.',
  ].join('\n')
}

export function appointmentCancelledMessage(appointment) {
  return [
    `Hola ${appointment.clientName}, te avisamos que tu turno en NexTorqen fue cancelado.`,
    `Fecha: ${appointment.date}`,
    `Hora: ${appointment.time}`,
    'Podemos coordinar un nuevo horario cuando quieras.',
  ].join('\n')
}

export function workOrderStatusMessage(order) {
  return [
    `Hola ${order.clientName}, te escribimos de NexTorqen por la orden ${order.number}.`,
    `Vehiculo: ${order.vehicleLabel || '-'}`,
    `Estado actual: ${order.status}`,
    order.total ? `Total estimado: ${formatCurrency(order.total)}` : '',
    'Cualquier novedad te avisamos por este medio.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function invoiceMessage(invoice) {
  return [
    `Hola ${invoice.clientName}, te enviamos el aviso de factura ${invoice.number} de NexTorqen.`,
    `Orden: ${invoice.orderNumber || '-'}`,
    `Vehiculo: ${invoice.vehicleLabel || '-'}`,
    `Estado: ${invoice.status}`,
    `Total: ${formatCurrency(invoice.total)}`,
    'Gracias por confiar en nuestro taller.',
  ].join('\n')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)
}
