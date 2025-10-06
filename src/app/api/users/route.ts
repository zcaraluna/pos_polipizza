import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo SYSADMIN puede ver todos los usuarios
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
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

    // Solo SYSADMIN puede crear usuarios
    if (user.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.lastName || !data.username || !data.email || !data.password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    // Check if cedula already exists
    const existingCedula = await prisma.user.findUnique({
      where: { cedula: data.cedula },
    })

    if (existingCedula) {
      return NextResponse.json(
        { error: 'La cédula ya está registrada' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        cedula: data.cedula,
        phone: data.phone,
        address: data.address,
        role: data.role,
        password: hashedPassword,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_USER',
        tableName: 'users',
        recordId: newUser.id,
        newValues: {
          name: newUser.name,
          lastName: newUser.lastName,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
    })

    // Return user without password
    const { password, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


