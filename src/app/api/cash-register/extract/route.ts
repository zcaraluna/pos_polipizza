import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to extract money
    if (!['ADMIN', 'SYSADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { amount, description } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if cash register is open
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    if (!cashRegister?.isOpen) {
      return NextResponse.json(
        { error: 'La caja debe estar abierta para realizar extracciones' },
        { status: 400 }
      )
    }

    if (Number(cashRegister.currentBalance) < Number(amount)) {
      return NextResponse.json(
        { error: 'Saldo insuficiente en la caja' },
        { status: 400 }
      )
    }

    // Extract money
    const result = await prisma.$transaction(async (tx) => {
      const updatedCashRegister = await tx.cashRegister.update({
        where: { id: 'default-cash-register' },
        data: {
          currentBalance: {
            decrement: Number(amount),
          },
        },
      })

      // Create extraction movement
      const movement = await tx.cashMovement.create({
        data: {
          cashRegisterId: 'default-cash-register',
          userId: user.id,
          type: 'EXTRACTION',
          amount: Number(amount),
          description: description || 'Extracción de efectivo',
        },
      })

      return { cashRegister: updatedCashRegister, movement }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EXTRACT_CASH',
        tableName: 'cash_register',
        recordId: 'default-cash-register',
        newValues: result.cashRegister,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Extract cash error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


