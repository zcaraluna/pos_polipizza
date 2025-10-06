import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to open cash register
    if (!['ADMIN', 'SYSADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { initialAmount } = await request.json()

    // Check if cash register is already open
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    if (cashRegister?.isOpen) {
      return NextResponse.json(
        { error: 'La caja ya está abierta' },
        { status: 400 }
      )
    }

    // Open cash register
    const result = await prisma.$transaction(async (tx) => {
      const updatedCashRegister = await tx.cashRegister.update({
        where: { id: 'default-cash-register' },
        data: {
          isOpen: true,
          currentBalance: Number(initialAmount) || 0,
          lastOpenedAt: new Date(),
        },
      })

      // Create opening movement
      const movement = await tx.cashMovement.create({
        data: {
          cashRegisterId: 'default-cash-register',
          userId: user.id,
          type: 'OPENING',
          amount: Number(initialAmount) || 0,
          description: 'Apertura de caja',
        },
      })

      return { cashRegister: updatedCashRegister, movement }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OPEN_CASH_REGISTER',
        tableName: 'cash_register',
        recordId: 'default-cash-register',
        newValues: result.cashRegister,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Open cash register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


