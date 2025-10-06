'use client'

import React, { useState, useEffect } from 'react'
import { Box, Typography, Divider } from '@mui/material'
import { generateQRCodeForTicket } from '@/lib/qrGenerator'

interface TicketPDFProps {
  orderNumber: string
  clientName?: string
  clientCedula?: string
  cashierName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
    addons?: Array<{
      name: string
      quantity: number
      price: number
    }>
    secondFlavor?: {
      productName: string
    }
    comments?: string
    otherIngredient?: string
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

export default function TicketPDF({
  orderNumber,
  clientName,
  clientCedula,
  cashierName,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  orderType,
  date,
  restaurantName,
  restaurantAddress,
  restaurantPhone,
  restaurantRuc,
  footerMessage,
}: TicketPDFProps) {
  const [qrCode, setQrCode] = useState<string>('')

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qr = await generateQRCodeForTicket(orderNumber, total, restaurantName)
        setQrCode(qr)
      } catch (error) {
        console.error('Error generando QR:', error)
      }
    }
    generateQR()
  }, [orderNumber, total, restaurantName])
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Box
      id="ticket-preview"
      sx={{
        width: '80mm', // Ancho estándar para impresoras térmicas
        maxWidth: '80mm',
        minWidth: '80mm',
        padding: '16px', // Márgenes más grandes
        fontFamily: 'monospace',
        backgroundColor: 'white',
        color: '#000000', // Negro puro para mejor contraste
        fontSize: '24px',
        fontWeight: '900',
        textShadow: '0.5px 0.5px 0px #000000',
        lineHeight: '1.2',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Box textAlign="center" mb={1}>
        <Typography variant="h6" sx={{ fontWeight: '900', fontSize: '32px', color: '#000000' }}>
          {restaurantName}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          {restaurantAddress}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          Tel: {restaurantPhone}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          RUC: {restaurantRuc}
        </Typography>
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* Order Info */}
      <Box mb={1}>
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
            <strong>Pedido:</strong> {(() => {
              const [date, number] = orderNumber.split('-')
              return (
                <>
                  {date}-<span style={{ fontSize: '32px', fontWeight: 'bold' }}>{number}</span>
                </>
              )
            })()}
          </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          <strong>Fecha:</strong> {new Date(date).toLocaleString('es-PY', { hour12: false })}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          <strong>Cajero:</strong> {cashierName}
        </Typography>
        {clientName && (
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
            <strong>Cliente:</strong> {clientName}
          </Typography>
        )}
          {clientCedula && (
            <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
              <strong>Doc. Num.:</strong> {clientCedula}
            </Typography>
          )}
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* Items */}
      <Box mb={1}>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000', mb: 1 }}>
          PRODUCTOS:
        </Typography>
        {items.map((item, index) => (
          <Box key={index} mb={0.5}>
            <Box display="flex" justifyContent="space-between">
              <Box flex={1}>
                <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
                  {item.quantity}x {item.name}
                  {item.secondFlavor && (
                    <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {' '}+ {item.secondFlavor.productName}
                    </span>
                  )}
                </Typography>
                {item.comments && (
                  <Typography variant="body2" sx={{ fontSize: '24px', color: '#666', fontWeight: 'bold', fontStyle: 'italic' }}>
                    Nota: {item.comments}
                  </Typography>
                )}
                {item.otherIngredient && (
                  <Typography variant="body2" sx={{ fontSize: '24px', color: '#1976d2', fontWeight: 'bold' }}>
                    {item.otherIngredient}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontSize: '28px', color: 'gray', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
                  {formatCurrency(item.price)} c/u
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
                {formatCurrency(item.subtotal)}
              </Typography>
            </Box>
            {item.addons && item.addons.length > 0 && (
              <Box sx={{ ml: 2 }}>
                {item.addons.map((addon, addonIndex) => (
                  <Box key={addonIndex} display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontSize: '24px', color: '#666666', fontWeight: '600' }}>
                      + {addon.quantity}x {addon.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '24px', color: '#666666', fontWeight: '600' }}>
                      {formatCurrency(addon.price * addon.quantity)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* Totals */}
      <Box mb={1}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
            Subtotal:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
            {formatCurrency(subtotal)}
          </Typography>
        </Box>
        {discount > 0 && (
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
              Descuento:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '28px', color: 'red', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
              -{formatCurrency(discount)}
            </Typography>
          </Box>
        )}
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
            TOTAL:
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
            {formatCurrency(total)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          <strong>Tipo de pedido:</strong> {orderType === 'PICKUP' ? 'Pasa a buscar/Para llevar' : 
                                          orderType === 'DELIVERY' ? 'Delivery' : 'Consumo en local'}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          <strong>Método de pago:</strong> {paymentMethod}
        </Typography>
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* Footer */}
      <Box textAlign="center">
        {footerMessage && (
          <Typography variant="body2" sx={{ fontSize: '28px', color: '#000000', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000', mb: 1 }}>
            {footerMessage}
          </Typography>
        )}
        <Typography variant="body2" sx={{ fontSize: '28px', color: 'gray', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          ¡Gracias por su compra!
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '28px', color: 'gray', fontWeight: '900', textShadow: '0.5px 0.5px 0px #000000' }}>
          Sistema de Gestión Pizza
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '22px', color: '#666', mt: 1, fontWeight: 'bold' }}>
          BitcanPOS - bitcan.com.py
        </Typography>
      </Box>
    </Box>
  )
}
