import { Network } from 'escpos-usb'
import QRCode from 'qrcode'
import { TicketData } from '@/types'
import { prisma } from '@/lib/prisma'

export class ThermalPrinter {
  private printer: Network

  constructor(ip?: string, port?: number) {
    // Si no se proporcionan parámetros, se obtendrán de la configuración
    this.printer = new Network(ip || '192.168.1.100', port || 9100)
  }

  async connect(): Promise<boolean> {
    try {
      await this.printer.open()
      return true
    } catch (error) {
      console.error('Error connecting to printer:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.printer.close()
    } catch (error) {
      console.error('Error disconnecting from printer:', error)
    }
  }

  async printTicket(ticketData: TicketData): Promise<boolean> {
    try {
      // Obtener configuración del sistema
      const config = await prisma.systemConfig.findFirst()
      if (!config) {
        throw new Error('No se encontró configuración del sistema')
      }

      // Actualizar configuración de la impresora si es necesario
      if (config.printerIp && config.printerPort) {
        this.printer = new Network(config.printerIp, config.printerPort)
      }

      const connected = await this.connect()
      if (!connected) {
        throw new Error('No se pudo conectar a la impresora')
      }

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(ticketData.qrCode || `PEDIDO:${ticketData.orderNumber}|TOTAL:${ticketData.total}|FECHA:${new Date().toISOString()}`, {
        width: 200,
        margin: 1,
      })

      // Print header con configuración del sistema
      this.printer.align('center')
      this.printer.size(2, 2)
      this.printer.text(`${config.restaurantName}\n`)
      this.printer.size(1, 1)
      this.printer.text(`${config.restaurantAddress}\n`)
      this.printer.text(`Tel: ${config.restaurantPhone}\n`)
      this.printer.text(`RUC: ${config.restaurantRuc}\n`)
      this.printer.drawLine()

      // Print order info
      this.printer.align('left')
      this.printer.text(`Pedido: ${ticketData.orderNumber}\n`)
      this.printer.text(`Fecha: ${new Date(ticketData.date).toLocaleString('es-PY', { hour12: false })}\n`)
      this.printer.text(`Cajero: ${ticketData.cashierName}\n`)
      
      if (ticketData.clientName) {
        this.printer.text(`Cliente: ${ticketData.clientName}\n`)
        if (ticketData.clientCedula) {
          this.printer.text(`Doc. Num.: ${ticketData.clientCedula}\n`)
        }
      }
      
      this.printer.drawLine()

      // Print items
      this.printer.text('PRODUCTOS:\n')
      this.printer.drawLine()
      
      ticketData.items.forEach((item) => {
        this.printer.text(`${item.name}\n`)
        this.printer.text(`  ${item.quantity} x ${this.formatCurrency(item.price)} = ${this.formatCurrency(item.subtotal)}\n`)
      })
      
      this.printer.drawLine()

      // Print totals
      this.printer.text(`Subtotal: ${this.formatCurrency(ticketData.subtotal)}\n`)
      if (ticketData.discount > 0) {
        this.printer.text(`Descuento: -${this.formatCurrency(ticketData.discount)}\n`)
      }
      this.printer.size(2, 1)
      this.printer.text(`TOTAL: ${this.formatCurrency(ticketData.total)}\n`)
      this.printer.size(1, 1)

      this.printer.text(`Método de pago: ${ticketData.paymentMethod}\n`)
      this.printer.drawLine()

      // Print QR code (if supported by printer)
      this.printer.align('center')
      this.printer.text('Código QR de verificación:\n')
      // Note: QR code printing depends on printer capabilities
      // Some thermal printers support direct QR printing
      
      this.printer.text('\n')
      
      // Print footer con configuración del sistema
      if (config.footerMessage) {
        this.printer.text(`${config.footerMessage}\n`)
      } else {
        this.printer.text('¡Gracias por su compra!\n')
      }
      this.printer.text('BitcanPOS - bitcan.com.py\n')
      
      this.printer.drawLine()
      this.printer.text('\n\n\n')

      // Cut paper
      this.printer.cut()

      await this.disconnect()
      return true
    } catch (error) {
      console.error('Error printing ticket:', error)
      await this.disconnect()
      return false
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  async testConnection(): Promise<boolean> {
    try {
      const connected = await this.connect()
      if (connected) {
        this.printer.text('Test de conexión - Impresora funcionando correctamente\n\n\n')
        this.printer.cut()
        await this.disconnect()
        return true
      }
      return false
    } catch (error) {
      console.error('Test connection error:', error)
      return false
    }
  }
}

// Factory function to create printer instance
export function createPrinter(): ThermalPrinter {
  // Usará configuración de la base de datos en tiempo de impresión
  return new ThermalPrinter()
}


