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
    const type = searchParams.get('type') || 'daily'

    // Calcular fechas según el tipo
    let dateFrom: Date
    let dateTo: Date

    if (startDate && endDate) {
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    } else {
      const now = new Date()
      switch (type) {
        case 'daily':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'weekly':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          dateFrom = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
          dateTo = new Date(dateFrom.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'monthly':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
          dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    }

    // Obtener ventas en el rango de fechas
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lt: dateTo,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
        client: true,
      },
    })

    // Calcular estadísticas
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const totalQuantity = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    // Ventas por hora
    const salesByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourSales = sales.filter(sale => new Date(sale.createdAt).getHours() === hour)
      const hourTotal = hourSales.reduce((sum, sale) => sum + Number(sale.total), 0)
      const hourQuantity = hourSales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      )
      return { hour, sales: hourTotal, quantity: hourQuantity }
    })

    // Ventas por producto
    const productSales = new Map<string, { quantity: number; revenue: number; name: string }>()
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.productId
        const productName = item.product?.name || 'Producto Desconocido'
        const existing = productSales.get(key)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += Number(item.subtotal)
        } else {
          productSales.set(key, {
            quantity: item.quantity,
            revenue: Number(item.subtotal),
            name: productName,
          })
        }
      })
    })

    const salesByProduct = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(product => ({
        productName: product.name,
        quantity: product.quantity,
        revenue: product.revenue
      }))

    // Ventas por usuario
    const userSales = new Map<string, { sales: number; quantity: number; name: string }>()
    sales.forEach(sale => {
      const key = sale.userId
      const existing = userSales.get(key)
      const saleQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0)
      const userName = sale.user ? `${sale.user.name} ${sale.user.lastName}` : 'Usuario Desconocido'
      if (existing) {
        existing.sales += Number(sale.total)
        existing.quantity += saleQuantity
      } else {
        userSales.set(key, {
          sales: Number(sale.total),
          quantity: saleQuantity,
          name: userName,
        })
      }
    })

    const salesByUser = Array.from(userSales.values())
      .sort((a, b) => b.sales - a.sales)
      .map(user => ({
        userName: user.name,
        sales: user.sales,
        quantity: user.quantity
      }))

    // Obtener configuración del sistema
    const config = await prisma.systemConfig.findFirst()

    return NextResponse.json({
      totalSales,
      totalQuantity,
      salesByHour,
      salesByProduct,
      salesByUser,
      config: config ? {
        restaurantName: config.restaurantName,
        restaurantAddress: config.restaurantAddress,
        restaurantPhone: config.restaurantPhone,
        restaurantRuc: config.restaurantRuc,
      } : null,
    })
  } catch (error) {
    console.error('Sales report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
