declare module 'escpos-usb' {
  export class Network {
    constructor(ip: string, port?: number)
    
    open(): Promise<void>
    close(): Promise<void>
    
    // Métodos de impresión
    align(alignment: 'left' | 'center' | 'right'): void
    size(width: number, height: number): void
    text(text: string): void
    drawLine(): void
    cut(): void
    
    // Otros métodos que podrías necesitar
    bold(enabled: boolean): void
    underline(enabled: boolean): void
    invert(enabled: boolean): void
    font(font: 'A' | 'B'): void
    feed(lines?: number): void
  }
}

