import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientData } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Get client error:', error)
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

    const data: ClientData = await request.json()

    // Get current client for audit log
    const currentClient = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!currentClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        cedula: data.cedula,
        ruc: data.ruc,
        requiresInvoice: data.requiresInvoice,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_CLIENT',
        tableName: 'clients',
        recordId: params.id,
        oldValues: currentClient,
        newValues: updatedClient,
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Update client error:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esta cédula o RUC' },
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

    // Check if client has sales
    const salesCount = await prisma.sale.count({
      where: { clientId: params.id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente que tiene ventas registradas' },
        { status: 400 }
      )
    }

    const client = await prisma.client.delete({
      where: { id: params.id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_CLIENT',
        tableName: 'clients',
        recordId: params.id,
        oldValues: client,
      },
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


