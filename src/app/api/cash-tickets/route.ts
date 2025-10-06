import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [tickets, total] = await Promise.all([
      prisma.cashTicket.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.cashTicket.count(),
    ])

    return NextResponse.json({
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching cash tickets:', error)
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

    const data = await request.json()
    const {
      cashRegisterId,
      openedAt,
      closedAt,
      hoursOpen,
      cashTotal,
      cardTotal,
      transferTotal,
      totalSales,
    } = data

    const ticket = await prisma.cashTicket.create({
      data: {
        cashRegisterId,
        userId: user.id,
        openedAt: new Date(openedAt),
        closedAt: closedAt ? new Date(closedAt) : null,
        hoursOpen,
        cashTotal,
        cardTotal,
        transferTotal,
        totalSales,
      },
      include: {
        user: {
          select: {
            name: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error creating cash ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


