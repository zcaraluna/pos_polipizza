import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    // Get total sales today
    const totalSalesToday = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        total: true,
      },
    })

    // Get new clients today
    const newClientsToday = await prisma.client.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    })

    // Get cash register status
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    // Get top products today
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    // Get product names for top products
    const productIds = topProducts.map(p => p.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const topProductsWithNames = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId)
      return {
        name: product?.name || 'Producto desconocido',
        quantity: item._sum.quantity || 0,
        revenue: Number(item._sum.subtotal || 0),
      }
    })

    // Get low stock alerts
    const lowStockAlerts = await prisma.ingredient.findMany({
      where: {
        currentStock: {
          lte: prisma.ingredient.fields.minStock,
        },
        isActive: true,
      },
      select: {
        name: true,
        currentStock: true,
        minStock: true,
      },
    })

    const stats = {
      totalSalesToday: Number(totalSalesToday._sum.total || 0),
      newClientsToday,
      cashRegisterStatus: {
        isOpen: cashRegister?.isOpen || false,
        currentBalance: Number(cashRegister?.currentBalance || 0),
      },
      topProducts: topProductsWithNames,
      lowStockAlerts: lowStockAlerts.map(alert => ({
        name: alert.name,
        currentStock: Number(alert.currentStock),
        minStock: Number(alert.minStock),
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


