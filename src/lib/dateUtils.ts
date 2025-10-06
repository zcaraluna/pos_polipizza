/**
 * Utilidades para manejo de fechas con zona horaria de Paraguay
 */

export const PARAGUAY_TIMEZONE = 'America/Asuncion'

/**
 * Obtiene la fecha actual en la zona horaria de Paraguay
 */
export function getParaguayDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: PARAGUAY_TIMEZONE }))
}

/**
 * Obtiene el inicio del día actual en Paraguay
 */
export function getParaguayStartOfDay(): Date {
  const now = getParaguayDate()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Obtiene el final del día actual en Paraguay
 */
export function getParaguayEndOfDay(): Date {
  const startOfDay = getParaguayStartOfDay()
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Convierte una fecha a string formateado para Paraguay
 */
export function formatParaguayDate(date: Date): string {
  return date.toLocaleString('es-PY', { 
    timeZone: PARAGUAY_TIMEZONE,
    hour12: false 
  })
}

/**
 * Convierte una fecha a string formateado solo fecha para Paraguay
 */
export function formatParaguayDateOnly(date: Date): string {
  return date.toLocaleDateString('es-PY', { 
    timeZone: PARAGUAY_TIMEZONE
  })
}

/**
 * Genera el número de orden con fecha de Paraguay
 */
export function generateOrderNumber(): string {
  const now = getParaguayDate()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear())
  return `${day}${month}${year}`
}

/**
 * Convierte una fecha UTC a fecha de Paraguay
 */
export function utcToParaguay(utcDate: Date): Date {
  return new Date(utcDate.toLocaleString('en-US', { timeZone: PARAGUAY_TIMEZONE }))
}


