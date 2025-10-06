import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IngredientData } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: params.id },
      include: {
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { name: true, lastName: true },
            },
          },
        },
      },
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    return NextResponse.json(ingredient)
  } catch (error) {
    console.error('Get ingredient error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: IngredientData = await request.json()

    // Get current ingredient for audit log
    const currentIngredient = await prisma.ingredient.findUnique({
      where: { id: params.id },
    })

    if (!currentIngredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const updatedIngredient = await prisma.ingredient.update({
      where: { id: params.id },
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
        action: 'UPDATE_INGREDIENT',
        tableName: 'ingredients',
        recordId: params.id,
        oldValues: currentIngredient,
        newValues: updatedIngredient,
      },
    })

    return NextResponse.json(updatedIngredient)
  } catch (error) {
    console.error('Update ingredient error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if ingredient is used in products
    const productCount = await prisma.productIngredient.count({
      where: { ingredientId: params.id },
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un ingrediente que está siendo usado en productos' },
        { status: 400 }
      )
    }

    const ingredient = await prisma.ingredient.delete({
      where: { id: params.id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_INGREDIENT',
        tableName: 'ingredients',
        recordId: params.id,
        oldValues: ingredient,
      },
    })

    return NextResponse.json({ message: 'Ingredient deleted successfully' })
  } catch (error) {
    console.error('Delete ingredient error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


