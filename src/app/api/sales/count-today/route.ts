import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParaguayStartOfDay, getParaguayEndOfDay } from '@/lib/dateUtils'

// Forzar renderizado dinámico para evitar cache
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const startOfDay = getParaguayStartOfDay()
    const endOfDay = getParaguayEndOfDay()

    const count = await prisma.sale.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error counting sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
