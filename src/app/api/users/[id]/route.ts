import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo SYSADMIN puede ver usuarios individuales
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
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
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error('Get user error:', error)
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

    // Solo SYSADMIN puede actualizar usuarios
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()

    // Get current user for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Check if username already exists (excluding current user)
    if (data.username && data.username !== currentUser.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya existe' },
          { status: 400 }
        )
      }
    }

    // Check if cedula already exists (excluding current user)
    if (data.cedula && data.cedula !== currentUser.cedula) {
      const existingCedula = await prisma.user.findUnique({
        where: { cedula: data.cedula },
      })

      if (existingCedula) {
        return NextResponse.json(
          { error: 'La cédula ya está registrada' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      cedula: data.cedula,
      phone: data.phone,
      address: data.address,
      role: data.role,
      isActive: data.isActive,
    }

    // Hash password if provided
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_USER',
        tableName: 'users',
        recordId: params.id,
        oldValues: {
          name: currentUser.name,
          lastName: currentUser.lastName,
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
          isActive: currentUser.isActive,
        },
        newValues: {
          name: updatedUser.name,
          lastName: updatedUser.lastName,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      },
    })

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Update user error:', error)
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

    // Solo SYSADMIN puede eliminar usuarios
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // No se puede eliminar a sí mismo
    if (user.id === params.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Check if user has sales
    const salesCount = await prisma.sale.count({
      where: { userId: params.id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un usuario que tiene ventas registradas' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_USER',
        tableName: 'users',
        recordId: params.id,
        oldValues: {
          name: targetUser.name,
          lastName: targetUser.lastName,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
    })

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


