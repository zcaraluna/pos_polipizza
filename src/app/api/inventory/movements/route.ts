import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ingredientId, type, quantity, reason } = await request.json()

    // Validate required fields
    if (!ingredientId || !type || !quantity) {
      return NextResponse.json(
        { error: 'Ingredient ID, type and quantity are required' },
        { status: 400 }
      )
    }

    if (type !== 'ENTRY' && type !== 'EXIT') {
      return NextResponse.json(
        { error: 'Type must be ENTRY or EXIT' },
        { status: 400 }
      )
    }

    // Get current ingredient
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Calculate new stock
    const newStock = type === 'ENTRY' 
      ? Number(ingredient.currentStock) + Number(quantity)
      : Number(ingredient.currentStock) - Number(quantity)

    if (newStock < 0) {
      return NextResponse.json(
        { error: 'Stock insuficiente para esta operación' },
        { status: 400 }
      )
    }

    // Update ingredient stock
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: newStock },
    })

    // Create movement record
    const movement = await prisma.inventoryMovement.create({
      data: {
        ingredientId,
        type,
        quantity: Number(quantity),
        reason,
        userId: user.id,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVENTORY_MOVEMENT',
        tableName: 'inventory_movements',
        recordId: movement.id,
        newValues: movement,
      },
    })

    return NextResponse.json({
      movement,
      updatedIngredient,
    })
  } catch (error) {
    console.error('Create inventory movement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


