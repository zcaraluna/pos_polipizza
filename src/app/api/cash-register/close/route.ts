import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getParaguayDate } from '@/lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to close cash register
    if (!['ADMIN', 'SYSADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { finalAmount } = await request.json()

    // Check if cash register is open
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    if (!cashRegister?.isOpen) {
      return NextResponse.json(
        { error: 'La caja ya está cerrada' },
        { status: 400 }
      )
    }

    // Get sales summary for the session before closing
    const openedAt = cashRegister.lastOpenedAt || cashRegister.createdAt
    const now = getParaguayDate()
    
    const salesSummary = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: openedAt,
          lt: now,
        },
      },
      _sum: {
        total: true,
      },
    })

    const cashTotal = salesSummary.find(s => s.paymentMethod === 'CASH')?._sum.total || 0
    const cardTotal = salesSummary.find(s => s.paymentMethod === 'CARD')?._sum.total || 0
    const transferTotal = salesSummary.find(s => s.paymentMethod === 'TRANSFER')?._sum.total || 0
    const totalSales = Number(cashTotal) + Number(cardTotal) + Number(transferTotal)

    // Calculate hours open
    const hoursOpen = (now.getTime() - openedAt.getTime()) / (1000 * 60 * 60)

    // Close cash register
    const result = await prisma.$transaction(async (tx) => {
      const updatedCashRegister = await tx.cashRegister.update({
        where: { id: 'default-cash-register' },
        data: {
          isOpen: false,
          currentBalance: Number(finalAmount) || 0,
          lastClosedAt: now,
        },
      })

      // Create closing movement
      const movement = await tx.cashMovement.create({
        data: {
          cashRegisterId: 'default-cash-register',
          userId: user.id,
          type: 'CLOSING',
          amount: Number(finalAmount) || 0,
          description: 'Cierre de caja',
        },
      })

      // Create cash ticket record
      const cashTicket = await tx.cashTicket.create({
        data: {
          cashRegisterId: 'default-cash-register',
          userId: user.id,
          openedAt: openedAt,
          closedAt: now,
          hoursOpen: hoursOpen,
          cashTotal: Number(cashTotal),
          cardTotal: Number(cardTotal),
          transferTotal: Number(transferTotal),
          totalSales: totalSales,
        },
      })

      return { cashRegister: updatedCashRegister, movement, cashTicket }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CLOSE_CASH_REGISTER',
        tableName: 'cash_register',
        recordId: 'default-cash-register',
        newValues: result.cashRegister,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Close cash register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


