import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createPrinter } from '@/lib/printer'

export async function POST() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to test printer
    if (!['ADMIN', 'SYSADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const printer = createPrinter()
    const success = await printer.testConnection()

    if (success) {
      return NextResponse.json({ message: 'Printer test successful' })
    } else {
      return NextResponse.json(
        { error: 'Printer test failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Printer test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


