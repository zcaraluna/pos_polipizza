import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPrinter } from '@/lib/printer'
import { TicketData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { saleId } = await request.json()

    if (!saleId) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      )
    }

    // Get sale data
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        client: {
          select: {
            name: true,
            lastName: true,
            cedula: true,
            ruc: true,
          },
        },
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
            addons: {
              include: {
                addon: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Obtener configuración del sistema
    const config = await prisma.systemConfig.findFirst()
    if (!config) {
      return NextResponse.json({ error: 'System configuration not found' }, { status: 500 })
    }

    // Prepare ticket data
    const ticketData: TicketData = {
      orderNumber: sale.orderNumber,
      clientName: sale.client ? `${sale.client.name} ${sale.client.lastName}` : undefined,
      clientCedula: sale.client?.cedula || sale.client?.ruc || undefined,
      cashierName: `${sale.user.name} ${sale.user.lastName}`,
      items: sale.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        addons: item.addons.map(addon => ({
          name: addon.addon.name,
          quantity: addon.quantity,
          price: Number(addon.addon.price),
        })),
      })),
      subtotal: sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0),
      discount: Number(sale.discount),
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      orderType: sale.orderType,
      date: sale.createdAt.toLocaleString('es-PY', { hour12: false }),
      restaurantName: config.restaurantName,
      restaurantAddress: config.restaurantAddress,
      restaurantPhone: config.restaurantPhone,
      restaurantRuc: config.restaurantRuc,
      footerMessage: config.footerMessage,
    }

    // Print ticket
    const printer = createPrinter()
    const success = await printer.printTicket(ticketData)

    if (success) {
      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PRINT_TICKET',
          tableName: 'sales',
          recordId: saleId,
          newValues: { orderNumber: sale.orderNumber },
        },
      })

      return NextResponse.json({ message: 'Ticket printed successfully' })
    } else {
      return NextResponse.json(
        { error: 'Error printing ticket' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Print ticket error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


