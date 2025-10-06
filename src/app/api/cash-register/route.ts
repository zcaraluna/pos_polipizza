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

    // Check if user has permission to access cash register
    if (!['ADMIN', 'SYSADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { id: 'default-cash-register' },
    })

    if (!cashRegister) {
      return NextResponse.json({ error: 'Cash register not found' }, { status: 404 })
    }

    // Get movements with pagination
    const [movements, movementsTotal] = await Promise.all([
      prisma.cashMovement.findMany({
        where: { cashRegisterId: cashRegister.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.cashMovement.count({
        where: { cashRegisterId: cashRegister.id },
      }),
    ])

    return NextResponse.json({
      cashRegister,
      movements,
      movementsTotal,
      pagination: {
        page,
        limit,
        total: movementsTotal,
        pages: Math.ceil(movementsTotal / limit),
      },
    })
  } catch (error) {
    console.error('Get cash register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


