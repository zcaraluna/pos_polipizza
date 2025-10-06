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

    // Obtener ingredientes con su valor total
    const ingredients = await prisma.ingredient.findMany()
    const totalValue = ingredients.reduce((sum, ingredient) => 
      sum + (Number(ingredient.currentStock) * Number(ingredient.cost)), 0
    )

    // Contar ingredientes con stock bajo
    const lowStockItems = ingredients.filter(ingredient => 
      Number(ingredient.currentStock) <= Number(ingredient.minStock)
    ).length

    // Obtener movimientos de inventario en el rango de fechas
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lt: dateTo,
        },
      },
      include: {
        ingredient: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedMovements = movements.map(movement => ({
      date: movement.createdAt.toISOString(),
      type: movement.type,
      ingredientName: movement.ingredient.name,
      quantity: Number(movement.quantity),
      reason: movement.reason,
    }))

    return NextResponse.json({
      totalValue,
      lowStockItems,
      movements: formattedMovements,
    })
  } catch (error) {
    console.error('Inventory report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


