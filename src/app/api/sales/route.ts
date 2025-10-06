import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SaleData } from '@/types'
import { getParaguayDate, getParaguayStartOfDay, getParaguayEndOfDay, generateOrderNumber } from '@/lib/dateUtils'

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
    const clientId = searchParams.get('clientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    
    if (clientId) {
      where.clientId = clientId
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              lastName: true,
              cedula: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
              addons: {
                include: {
                  addon: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: SaleData = await request.json()

    // Validate required fields
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Check if cash register is open
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    if (!cashRegister?.isOpen) {
      return NextResponse.json(
        { error: 'La caja debe estar abierta para realizar ventas' },
        { status: 400 }
      )
    }

    // Generate order number
    const today = getParaguayDate()
    const dateStr = generateOrderNumber()
    const startOfDay = getParaguayStartOfDay()
    const endOfDay = getParaguayEndOfDay()
    
    const orderCount = await prisma.sale.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    })
    const orderNumber = `${dateStr}-${String(orderCount + 1).padStart(3, '0')}`

    // Create sale with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          clientId: data.clientId,
          userId: user.id,
          total: data.total,
          discount: data.discount,
          deliveryCost: data.deliveryCost || 0,
          paymentMethod: data.paymentMethod,
          orderType: data.orderType,
          orderNumber,
        },
      })

      // Create sale items and update stock
      const saleItems = await Promise.all(
        data.items.map(async (item) => {
          // Create sale item
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              secondFlavorProductId: item.secondFlavor?.productId || null,
              secondFlavorProductName: item.secondFlavor?.productName || null,
              comments: item.comments || null,
              otherIngredient: item.otherIngredient || null,
            },
          })

          // Create addons if they exist
          if (item.addons && item.addons.length > 0) {
            await Promise.all(
              item.addons.map(async (addon) => {
                await tx.saleItemAddon.create({
                  data: {
                    saleItemId: saleItem.id,
                    addonId: addon.addonId,
                    quantity: addon.quantity,
                  },
                })
              })
            )
          }

          // Update product stock if it has stock tracking
          await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { not: null }
            },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })

          return saleItem
        })
      )

      // Update cash register balance
      await tx.cashRegister.update({
        where: { id: 'default-cash-register' },
        data: {
          currentBalance: {
            increment: data.total,
          },
        },
      })

      // Create cash movement
      await tx.cashMovement.create({
        data: {
          cashRegisterId: 'default-cash-register',
          userId: user.id,
          type: 'SALE',
          amount: data.total,
          description: `Venta #${orderNumber}`,
          saleId: sale.id,
        },
      })

      return { sale, saleItems }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_SALE',
        tableName: 'sales',
        recordId: result.sale.id,
        newValues: result.sale,
      },
    })

    return NextResponse.json(result.sale)
  } catch (error) {
    console.error('Create sale error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


