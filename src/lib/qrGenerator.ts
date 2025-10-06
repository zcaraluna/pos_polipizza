import QRCode from 'qrcode'

export interface QRData {
  orderNumber: string
  date: string
  total: number
  restaurantName: string
  verificationUrl?: string
}

export const generateQRCode = async (data: QRData): Promise<string> => {
  try {
    // Crear un objeto con la información del ticket
    const qrData = {
      orderNumber: data.orderNumber,
      date: data.date,
      total: data.total,
      restaurant: data.restaurantName,
      verificationUrl: data.verificationUrl || `${window.location.origin}/verify/${data.orderNumber}`,
      timestamp: new Date().toISOString(),
    }

    // Generar el código QR como string base64
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })

    return qrCodeDataURL
  } catch (error) {
    console.error('Error generando QR:', error)
    throw new Error('Error al generar el código QR')
  }
}

export const generateQRCodeForTicket = async (
  orderNumber: string,
  total: number,
  restaurantName: string
): Promise<string> => {
  const qrData: QRData = {
    orderNumber,
    date: new Date().toISOString(),
    total,
    restaurantName,
  }

  return generateQRCode(qrData)
}


