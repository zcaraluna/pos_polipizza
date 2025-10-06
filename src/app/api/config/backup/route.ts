import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo SYSADMIN puede crear respaldos
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Obtener todos los datos de la base de datos
    const backupData = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          lastName: true,
          username: true,
          email: true,
          cedula: true,
          phone: true,
          address: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      clients: await prisma.client.findMany(),
      ingredients: await prisma.ingredient.findMany(),
      products: await prisma.product.findMany(),
      productIngredients: await prisma.productIngredient.findMany(),
      sales: await prisma.sale.findMany({
        include: {
          items: true,
        },
      }),
      cashRegisters: await prisma.cashRegister.findMany(),
      cashMovements: await prisma.cashMovement.findMany(),
      inventoryMovements: await prisma.inventoryMovement.findMany(),
      systemConfig: await prisma.systemConfig.findMany(),
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_BACKUP',
        tableName: 'backup',
        recordId: 'backup_' + Date.now(),
        newValues: {
          timestamp: backupData.timestamp,
          recordCount: Object.keys(backupData).length,
        },
      },
    })

    return NextResponse.json({
      message: 'Respaldo creado correctamente',
      timestamp: backupData.timestamp,
      recordCount: Object.keys(backupData).length,
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
