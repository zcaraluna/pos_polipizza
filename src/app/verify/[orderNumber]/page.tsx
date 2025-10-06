'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Verified,
  Error,
  Receipt,
  Store,
  Person,
  AttachMoney,
} from '@mui/icons-material'
import AppLayout from '@/components/Layout/AppLayout'

interface SaleData {
  id: string
  orderNumber: string
  total: number
  discount: number
  paymentMethod: string
  createdAt: string
  client?: {
    name: string
    lastName: string
    cedula?: string
    ruc?: string
  }
  user: {
    name: string
    lastName: string
  }
  items: Array<{
    productName: string
    quantity: number
    price: number
    subtotal: number
  }>
}

export default function VerifyTicketPage({ params }: { params: { orderNumber: string } }) {
  const [loading, setLoading] = useState(true)
  const [sale, setSale] = useState<SaleData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSaleData()
  }, [params.orderNumber])

  const fetchSaleData = async () => {
    try {
      const response = await fetch(`/api/sales/verify/${params.orderNumber}`)
      if (response.ok) {
        const data = await response.json()
        setSale(data)
      } else {
        setError('Ticket no encontrado o inválido')
      }
    } catch (error) {
      setError('Error al verificar el ticket')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <AppLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Verificando ticket...
          </Typography>
        </Box>
      </AppLayout>
    )
  }

  if (error || !sale) {
    return (
      <AppLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Card sx={{ maxWidth: 500, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Ticket No Válido
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {error || 'El ticket solicitado no existe o ha expirado.'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Box>
        <Box display="flex" justifyContent="center" alignItems="center" mb={4}>
          <Card sx={{ maxWidth: 800, width: '100%' }}>
            <CardContent>
              {/* Header de Verificación */}
              <Box textAlign="center" mb={3}>
                <Verified sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  ✅ Ticket Verificado
                </Typography>
                <Typography variant="h6" color="primary">
                  Orden #{sale.orderNumber}
                </Typography>
                <Chip
                  label="VÁLIDO"
                  color="success"
                  sx={{ mt: 1, fontSize: '14px', fontWeight: 'bold' }}
                />
              </Box>

              <Grid container spacing={3}>
                {/* Información de la Venta */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Información de la Venta
                      </Typography>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Número de Orden:</strong> #{sale.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Fecha:</strong> {new Date(sale.createdAt).toLocaleString('es-PY', { hour12: false })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Método de Pago:</strong> {sale.paymentMethod}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                          <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Total:
                        </Typography>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                          {formatCurrency(sale.total)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Información del Cliente y Cajero */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Información del Cliente
                      </Typography>
                      {sale.client ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Cliente:</strong> {sale.client.name} {sale.client.lastName}
                          </Typography>
                          {sale.client.cedula && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Cédula:</strong> {sale.client.cedula}
                            </Typography>
                          )}
                          {sale.client.ruc && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>RUC:</strong> {sale.client.ruc}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Venta sin cliente registrado
                        </Typography>
                      )}
                      
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Cajero:</strong> {sale.user.name} {sale.user.lastName}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Productos */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Store sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Productos Adquiridos
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Producto</TableCell>
                              <TableCell align="right">Cantidad</TableCell>
                              <TableCell align="right">Precio Unit.</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sale.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      {sale.discount > 0 && (
                        <Box mt={2} display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Descuento aplicado:
                          </Typography>
                          <Typography variant="body2" color="error">
                            -{formatCurrency(sale.discount)}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Footer de Verificación */}
              <Box textAlign="center" mt={3}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Este ticket ha sido verificado exitosamente.</strong><br />
                    La información mostrada es auténtica y corresponde a una venta real registrada en nuestro sistema.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Verificado el {new Date().toLocaleString('es-PY')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </AppLayout>
  )
}


