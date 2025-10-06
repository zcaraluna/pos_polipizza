import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface TicketData {
  orderNumber: string
  clientName?: string
  clientCedula?: string
  cashierName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  orderType: string
  date: string
  restaurantName: string
  restaurantAddress: string
  restaurantPhone: string
  restaurantRuc: string
  footerMessage?: string
}

export const generateTicketPDF = async (ticketData: TicketData): Promise<void> => {
  try {
    // Crear un elemento temporal para renderizar el ticket
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    document.body.appendChild(tempDiv)

    // Importar dinámicamente el componente TicketPDF
    const { default: TicketPDF } = await import('@/components/TicketPDF')
    
    // Crear un elemento React temporal
    const React = await import('react')
    const ReactDOM = await import('react-dom/client')
    
    const root = ReactDOM.createRoot(tempDiv)
    
    await new Promise<void>((resolve) => {
      root.render(React.createElement(TicketPDF, ticketData))
      setTimeout(resolve, 100) // Esperar a que se renderice
    })

    // Capturar el contenido como imagen
    const canvas = await html2canvas(tempDiv, {
      width: 300,
      height: tempDiv.scrollHeight,
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    // Limpiar el elemento temporal
    root.unmount()
    document.body.removeChild(tempDiv)

    // Crear PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200], // Tamaño de ticket térmico
    })

    const imgWidth = 80
    const pageHeight = 200
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Descargar el PDF
    const fileName = `ticket_${ticketData.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

  } catch (error) {
    console.error('Error generando PDF:', error)
    throw new Error('Error al generar el PDF del ticket')
  }
}

export const generateTicketPDFFromElement = async (elementId: string, fileName?: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Elemento no encontrado')
    }

    // Esperar un poco para asegurar que el contenido esté renderizado
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verificar que el elemento tenga contenido
    if (element.scrollHeight === 0 || element.scrollWidth === 0) {
      throw new Error('El elemento no tiene contenido visible')
    }

    console.log('Elemento encontrado:', {
      id: elementId,
      width: element.scrollWidth,
      height: element.scrollHeight,
      hasContent: element.innerHTML.length > 0
    })

    // Capturar el contenido como imagen con alta resolución y contraste
    const canvas = await html2canvas(element, {
      width: element.scrollWidth || 320, // Ajustado para márgenes más grandes
      height: element.scrollHeight || 400,
      scale: 2, // Reducir escala para evitar problemas
      useCORS: true,
      backgroundColor: '#ffffff',
      allowTaint: true,
      logging: true, // Habilitar logging para debug
      foreignObjectRendering: false, // Deshabilitar para evitar problemas
      removeContainer: false,
    })

    // Verificar que el canvas tenga contenido
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('El canvas está vacío')
    }

    console.log('Canvas generado:', {
      width: canvas.width,
      height: canvas.height,
      hasContent: canvas.width > 0 && canvas.height > 0
    })

    // Convertir canvas a imagen con alta calidad y contraste
    const imgData = canvas.toDataURL('image/png', 1.0) // Máxima calidad
    
    // Aplicar filtros de contraste adicionales si es necesario
    let finalImgData = imgData // Inicializar con valor por defecto
    
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCtx.drawImage(canvas, 0, 0)
      
      // Aplicar filtro de contraste
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        // Aumentar contraste significativamente para ZKTeco
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Aplicar umbral para hacer texto más negro
        if (r < 200 || g < 200 || b < 200) {
          // Si no es blanco puro, hacer más negro
          data[i] = Math.max(0, r * 0.3)     // Red más oscuro
          data[i + 1] = Math.max(0, g * 0.3) // Green más oscuro
          data[i + 2] = Math.max(0, b * 0.3) // Blue más oscuro
        } else {
          // Mantener blanco puro
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        }
      }
      
      tempCtx.putImageData(imageData, 0, 0)
      finalImgData = tempCanvas.toDataURL('image/png', 1.0)
    }
    
    // Verificar que finalImgData no esté vacío
    if (!finalImgData || finalImgData === 'data:,') {
      throw new Error('No se pudo generar la imagen del canvas')
    }
    
    // Calcular la altura necesaria basada en el contenido
    const imgWidth = 80 // mm - Ancho estándar para impresoras térmicas
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Crear PDF con altura dinámica y alta calidad
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, Math.max(imgHeight + 10, 50)], // Altura mínima de 50mm
      compress: false, // No comprimir para mantener calidad
      precision: 2, // Mayor precisión
    })

    // Agregar la imagen al PDF
    pdf.addImage(finalImgData, 'PNG', 0, 5, imgWidth, imgHeight)

    // Descargar el PDF
    const finalFileName = fileName || `ticket_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(finalFileName)

  } catch (error) {
    console.error('Error generando PDF:', error)
    throw new Error('Error al generar el PDF del ticket')
  }
}


