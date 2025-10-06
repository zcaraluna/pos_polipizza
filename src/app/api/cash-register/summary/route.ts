import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParaguayDate } from '@/lib/dateUtils'

// Forzar renderizado dinámico para evitar cache
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Obtener información de la caja actual
    const cashRegister = await prisma.cashRegister.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!cashRegister) {
      return NextResponse.json({
        cash: 0,
        card: 0,
        transfer: 0,
        total: 0,
        sessionInfo: {
          isOpen: false,
          openedAt: null,
          closedAt: null,
          hoursOpen: 0
        }
      })
    }

    // Determinar el rango de fechas basado en la jornada de caja
    let startDate: Date
    let endDate: Date

    if (cashRegister.isOpen) {
      // Si la caja está abierta, desde la última apertura hasta ahora
      startDate = cashRegister.lastOpenedAt || cashRegister.createdAt
      endDate = new Date() // Usar fecha actual del servidor
    } else {
      // Si la caja está cerrada, desde la última apertura hasta el último cierre
      startDate = cashRegister.lastOpenedAt || cashRegister.createdAt
      endDate = cashRegister.lastClosedAt || new Date()
    }

    // Obtener ventas de la jornada agrupadas por método de pago
    const salesByMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        total: true,
      },
    })

    // Inicializar totales
    const summary = {
      cash: 0,
      card: 0,
      transfer: 0,
      total: 0,
    }

    // Procesar los resultados
    salesByMethod.forEach((sale) => {
      const amount = Number(sale._sum.total || 0)
      summary.total += amount

      switch (sale.paymentMethod) {
        case 'CASH':
          summary.cash += amount
          break
        case 'CARD':
          summary.card += amount
          break
        case 'TRANSFER':
          summary.transfer += amount
          break
      }
    })

    // Calcular horas de apertura
    const hoursOpen = cashRegister.isOpen && cashRegister.lastOpenedAt
      ? (new Date().getTime() - cashRegister.lastOpenedAt.getTime()) / (1000 * 60 * 60)
      : cashRegister.lastOpenedAt && cashRegister.lastClosedAt
      ? (cashRegister.lastClosedAt.getTime() - cashRegister.lastOpenedAt.getTime()) / (1000 * 60 * 60)
      : 0

    // Información de la jornada
    const sessionInfo = {
      isOpen: cashRegister.isOpen,
      openedAt: cashRegister.lastOpenedAt,
      closedAt: cashRegister.lastClosedAt,
      hoursOpen: Math.round(hoursOpen * 100) / 100 // Redondear a 2 decimales
    }

    return NextResponse.json({
      ...summary,
      sessionInfo
    })
  } catch (error) {
    console.error('Error getting cash register summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
