import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Forzar renderizado dinámico para evitar cache
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calcular fechas
    let dateFrom: Date
    let dateTo: Date

    if (startDate && endDate) {
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    } else {
      const now = new Date()
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    }

    // Obtener caja registradora
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    // Obtener movimientos de caja en el rango de fechas
    const movements = await prisma.cashMovement.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lt: dateTo,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Calcular estadísticas
    const openingBalance = 0 // No se almacena en el modelo actual
    const closingBalance = cashRegister?.currentBalance || 0
    
    const totalSales = movements
      .filter(m => m.type === 'SALE')
      .reduce((sum, m) => sum + Number(m.amount), 0)
    
    const totalExtractions = movements
      .filter(m => m.type === 'EXTRACTION')
      .reduce((sum, m) => sum + Number(m.amount), 0)

    const formattedMovements = movements.map(movement => ({
      time: new Date(movement.createdAt).toLocaleTimeString(),
      type: movement.type,
      amount: Number(movement.amount),
      description: movement.description,
      userName: `${movement.user.name} ${movement.user.lastName}`,
    }))

    return NextResponse.json({
      openingBalance,
      closingBalance,
      totalSales,
      totalExtractions,
      movements: formattedMovements,
    })
  } catch (error) {
    console.error('Cash report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


