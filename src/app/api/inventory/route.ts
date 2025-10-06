import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IngredientData } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    }
    
    if (lowStock) {
      where.currentStock = {
        lte: prisma.ingredient.fields.minStock,
      }
    }

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.ingredient.count({ where }),
    ])

    return NextResponse.json({
      ingredients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get ingredients error:', error)
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

    const data: IngredientData = await request.json()

    // Validate required fields
    if (!data.name || !data.unit || data.minStock < 0 || data.currentStock < 0) {
      return NextResponse.json(
        { error: 'Name, unit, minStock and currentStock are required' },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: data.name,
        description: data.description,
        unit: data.unit,
        minStock: data.minStock,
        currentStock: data.currentStock,
        cost: data.cost,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_INGREDIENT',
        tableName: 'ingredients',
        recordId: ingredient.id,
        newValues: ingredient,
      },
    })

    return NextResponse.json(ingredient)
  } catch (error) {
    console.error('Create ingredient error:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un ingrediente con este nombre' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


