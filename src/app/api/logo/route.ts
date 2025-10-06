import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const imagePath = path.join(process.cwd(), 'public', 'polipizza.png')
    
    if (!fs.existsSync(imagePath)) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const imageBuffer = fs.readFileSync(imagePath)
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving logo:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}


