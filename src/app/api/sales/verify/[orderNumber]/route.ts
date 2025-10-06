import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        client: true,
        user: {
          select: {
            name: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    // Formatear los datos para la respuesta
    const formattedSale = {
      id: sale.id,
      orderNumber: sale.orderNumber,
      total: Number(sale.total),
      discount: Number(sale.discount),
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt.toISOString(),
      client: sale.client ? {
        name: sale.client.name,
        lastName: sale.client.lastName,
        cedula: sale.client.cedula,
        ruc: sale.client.ruc,
      } : null,
      user: {
        name: sale.user.name,
        lastName: sale.user.lastName,
      },
      items: sale.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    }

    return NextResponse.json(formattedSale)
  } catch (error) {
    console.error('Verify sale error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


