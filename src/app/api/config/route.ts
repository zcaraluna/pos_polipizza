import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo SYSADMIN puede ver la configuración
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const config = await prisma.systemConfig.findFirst()

    if (!config) {
      // Crear configuración por defecto si no existe
      const defaultConfig = await prisma.systemConfig.create({
        data: {
          restaurantName: 'Polipizza',
          restaurantAddress: 'Dirección del restaurante',
          restaurantPhone: '+595 21 123 456',
          restaurantRuc: '12345678-9',
          ivaRate: 10,
          printerIp: '192.168.1.100',
          printerPort: 9100,
          paperWidth: 58,
          logoUrl: '',
          footerMessage: '¡Gracias por su compra!',
          passwordExpiryDays: 90,
          maxFailedAttempts: 5,
          sessionTimeoutMinutes: 60,
          enableAuditLog: true,
          autoBackup: false,
          backupFrequency: 'weekly',
        },
      })
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo SYSADMIN puede actualizar la configuración
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()

    // Get current config for audit log
    const currentConfig = await prisma.systemConfig.findFirst()

    let updatedConfig

    if (currentConfig) {
      updatedConfig = await prisma.systemConfig.update({
        where: { id: currentConfig.id },
        data: {
          restaurantName: data.restaurantName,
          restaurantAddress: data.restaurantAddress,
          restaurantPhone: data.restaurantPhone,
          restaurantRuc: data.restaurantRuc,
          ivaRate: data.ivaRate,
          printerIp: data.printerIp,
          printerPort: data.printerPort,
          paperWidth: data.paperWidth,
          logoUrl: data.logoUrl,
          footerMessage: data.footerMessage,
          passwordExpiryDays: data.passwordExpiryDays,
          maxFailedAttempts: data.maxFailedAttempts,
          sessionTimeoutMinutes: data.sessionTimeoutMinutes,
          enableAuditLog: data.enableAuditLog,
          autoBackup: data.autoBackup,
          backupFrequency: data.backupFrequency,
        },
      })
    } else {
      updatedConfig = await prisma.systemConfig.create({
        data: {
          restaurantName: data.restaurantName,
          restaurantAddress: data.restaurantAddress,
          restaurantPhone: data.restaurantPhone,
          restaurantRuc: data.restaurantRuc,
          ivaRate: data.ivaRate,
          printerIp: data.printerIp,
          printerPort: data.printerPort,
          paperWidth: data.paperWidth,
          logoUrl: data.logoUrl,
          footerMessage: data.footerMessage,
          passwordExpiryDays: data.passwordExpiryDays,
          maxFailedAttempts: data.maxFailedAttempts,
          sessionTimeoutMinutes: data.sessionTimeoutMinutes,
          enableAuditLog: data.enableAuditLog,
          autoBackup: data.autoBackup,
          backupFrequency: data.backupFrequency,
        },
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_CONFIG',
        tableName: 'system_config',
        recordId: updatedConfig.id,
        oldValues: currentConfig ? JSON.stringify(currentConfig) : undefined,
        newValues: JSON.stringify(updatedConfig),
      },
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


