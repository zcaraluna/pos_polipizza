'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Pagination,
  Stack,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/es'
import {
  Search,
  Print,
  FilterList,
  Refresh,
} from '@mui/icons-material'
import AppLayout from '@/components/Layout/AppLayout'
import { generateTicketPDFFromElement } from '@/lib/pdfGenerator'
import { getParaguayDate, getParaguayStartOfDay, getParaguayEndOfDay } from '@/lib/dateUtils'

interface Sale {
  id: string
  orderNumber: string
  total: number
  createdAt: string
  orderType: string
  user: {
    name: string
    lastName: string
  }
  client?: {
    name: string
    lastName: string
    cedula?: string
    ruc?: string
  }
  items: Array<{
    product: {
      name: string
    }
    quantity: number
    price: number
    subtotal: number
    secondFlavorProductName?: string
    comments?: string
    otherIngredient?: string
    addons?: Array<{
      addon: {
        name: string
        price: number
      }
      quantity: number
    }>
  }>
  paymentMethod: string
  discount: number
  deliveryCost: number
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [systemConfig, setSystemConfig] = useState({
    restaurantName: 'Polipizza',
    restaurantAddress: 'Dirección del restaurante',
    restaurantPhone: '+595 21 123 456',
    restaurantRuc: '12345678-9',
    footerMessage: '¡Gracias por su compra!',
  })

  useEffect(() => {
    fetchSales()
    fetchSystemConfig()
    fetchAvailableDates()
  }, [dateFilter, pagination.page])

  // Efecto para búsqueda automática cuando se selecciona una fecha
  useEffect(() => {
    if (dateFilter === 'custom' && selectedDate) {
      console.log('useEffect: Fecha detectada, ejecutando búsqueda automática')
      fetchSales()
    }
  }, [selectedDate, dateFilter])

  const fetchAvailableDates = async () => {
    try {
      // Obtener ventas de los últimos 6 meses para mostrar fechas disponibles
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const today = new Date()
      
      const response = await fetch(`/api/sales?startDate=${sixMonthsAgo.toISOString()}&endDate=${today.toISOString()}&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        const sales = data.sales || []
        
        // Extraer fechas únicas y formatearlas
        const dateStrings = sales.map((sale: any) => {
          const date = new Date(sale.createdAt)
          return date.toISOString().split('T')[0] // Formato YYYY-MM-DD
        })
        const uniqueDates = Array.from(new Set(dateStrings)) as string[]
        
        setAvailableDates(uniqueDates.sort().reverse()) // Más recientes primero
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    }
  }

  const fetchSystemConfig = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const config = await response.json()
        setSystemConfig({
          restaurantName: config.restaurantName,
          restaurantAddress: config.restaurantAddress,
          restaurantPhone: config.restaurantPhone,
          restaurantRuc: config.restaurantRuc,
          footerMessage: config.footerMessage,
        })
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
    }
  }

  const fetchSales = async () => {
    try {
      setLoading(true)
      let startDate: Date
      let endDate: Date

      if (dateFilter === 'custom') {
        if (!selectedDate) {
          // No mostrar error si no hay fecha seleccionada, simplemente no hacer nada
          setLoading(false)
          return
        }
        // Convertir a Date si no lo es
        const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate)
        if (isNaN(dateObj.getTime())) {
          console.error('Fecha inválida:', selectedDate)
          setLoading(false)
          return
        }
        startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0)
        endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59)
        console.log('Buscando ventas para fecha:', dateObj.toISOString().split('T')[0])
      } else if (dateFilter === 'today') {
        startDate = getParaguayStartOfDay()
        endDate = getParaguayEndOfDay()
      } else if (dateFilter === 'week') {
        const today = getParaguayDate()
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = getParaguayEndOfDay()
      } else if (dateFilter === 'month') {
        const today = getParaguayDate()
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        endDate = getParaguayEndOfDay()
      } else {
        startDate = getParaguayStartOfDay()
        endDate = getParaguayEndOfDay()
      }

      const response = await fetch(`/api/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&page=${pagination.page}&limit=${pagination.limit}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Respuesta de API:', data)
        setSales(data.sales || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }))
      } else {
        console.error('Error en respuesta de API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSearch = async () => {
    // Si no hay término de búsqueda, simplemente ejecutar fetchSales
    if (!searchTerm.trim()) {
      fetchSales()
      return
    }

    setLoading(true)
    try {
      let startDate: Date
      let endDate: Date

      if (dateFilter === 'custom') {
        if (!selectedDate) {
          // No mostrar error si no hay fecha seleccionada, simplemente no hacer nada
          setLoading(false)
          return
        }
        // Convertir a Date si no lo es
        const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate)
        if (isNaN(dateObj.getTime())) {
          console.error('Fecha inválida:', selectedDate)
          setLoading(false)
          return
        }
        startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0)
        endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59)
      } else if (dateFilter === 'today') {
        startDate = getParaguayStartOfDay()
        endDate = getParaguayEndOfDay()
      } else if (dateFilter === 'week') {
        const today = getParaguayDate()
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = getParaguayEndOfDay()
      } else if (dateFilter === 'month') {
        const today = getParaguayDate()
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        endDate = getParaguayEndOfDay()
      } else {
        startDate = getParaguayStartOfDay()
        endDate = getParaguayEndOfDay()
      }

      // Buscar todas las ventas sin paginación para filtrar
      const response = await fetch(`/api/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        const allSales = data.sales || []
        
        const filteredSales = allSales.filter((sale: any) => {
          const searchLower = searchTerm.toLowerCase()
          return (
            sale.orderNumber.toLowerCase().includes(searchLower) ||
            sale.user.name.toLowerCase().includes(searchLower) ||
            sale.user.lastName.toLowerCase().includes(searchLower) ||
            (sale.client?.name && sale.client.name.toLowerCase().includes(searchLower)) ||
            (sale.client?.lastName && sale.client.lastName.toLowerCase().includes(searchLower)) ||
            (sale.client?.cedula && sale.client.cedula.includes(searchTerm)) ||
            (sale.client?.ruc && sale.client.ruc.includes(searchTerm))
          )
        })
        
        setSales(filteredSales)
        setPagination(prev => ({
          ...prev,
          total: filteredSales.length,
          pages: Math.ceil(filteredSales.length / prev.limit)
        }))
      }
    } catch (error) {
      console.error('Error searching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchTerm('')
    setSelectedDate(null)
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchSales()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PY', { hour12: false })
  }

  const handlePrintTicket = async (sale: Sale) => {
    setSelectedSale(sale)
    setTicketDialogOpen(true)
  }

  const handleGeneratePDF = async () => {
    if (!selectedSale) return

    setGeneratingPDF(true)
    try {
      await generateTicketPDFFromElement('ticket-preview', `ticket_${selectedSale.orderNumber}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Efectivo'
      case 'CARD': return 'Tarjeta'
      case 'TRANSFER': return 'Transferencia'
      default: return method
    }
  }

  return (
    <AppLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Historial de Ventas
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSales}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Buscar"
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    placeholder="Número de ticket, cliente, CI/RUC..."
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Período"
                      onChange={(e: any) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="today">Hoy</MenuItem>
                      <MenuItem value="week">Última semana</MenuItem>
                      <MenuItem value="month">Último mes</MenuItem>
                      <MenuItem value="custom">Fecha exacta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    Buscar
                  </Button>
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={resetSearch}
                    disabled={loading}
                  >
                    Limpiar
                  </Button>
                </Grid>
                
                {/* Selector de fecha personalizado */}
                {dateFilter === 'custom' && (
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="Seleccionar fecha"
                      value={selectedDate}
                      onChange={(newValue) => {
                        console.log('Fecha seleccionada:', newValue)
                        setSelectedDate(newValue)
                      }}
                      shouldDisableDate={(date) => {
                        if (!date) return false
                        try {
                          const dateObj = date instanceof Date ? date : new Date(date)
                          if (isNaN(dateObj.getTime())) return true
                          const dateString = dateObj.toISOString().split('T')[0]
                          return !availableDates.includes(dateString)
                        } catch (error) {
                          console.error('Error en shouldDisableDate:', error)
                          return true
                        }
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small'
                        }
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </LocalizationProvider>
          </CardContent>
        </Card>

        {/* Tabla de ventas */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ticket</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vendedor</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No se encontraron ventas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {sale.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(sale.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {sale.client ? (
                            <Box>
                              <Typography variant="body2">
                                {sale.client.name} {sale.client.lastName}
                              </Typography>
                              {(sale.client.cedula || sale.client.ruc) && (
                                <Typography variant="caption" color="text.secondary">
                                  {sale.client.cedula || sale.client.ruc}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Consumidor final
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sale.user.name} {sale.user.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(sale.total)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(sale.paymentMethod)}
                            size="small"
                            color={
                              sale.paymentMethod === 'CASH' ? 'success' :
                              sale.paymentMethod === 'CARD' ? 'primary' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handlePrintTicket(sale)}
                            title="Reimprimir ticket"
                          >
                            <Print />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Información de paginación y controles */}
            {!loading && sales.length > 0 && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} ventas
                  </Typography>
                  
                  {pagination.pages > 1 && (
                    <Pagination
                      count={pagination.pages}
                      page={pagination.page}
                      onChange={(_, page) => handlePageChange(page)}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  )}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Modal de ticket */}
        <Dialog
          open={ticketDialogOpen}
          onClose={() => setTicketDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Ticket - {selectedSale?.orderNumber}
          </DialogTitle>
          <DialogContent>
            {selectedSale && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Vista previa del ticket
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Print />}
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                  >
                    {generatingPDF ? 'Generando...' : 'Descargar PDF'}
                  </Button>
                </Box>
                <Paper 
                  id="ticket-preview"
                  variant="outlined" 
                  sx={{ 
                    p: 4, 
                    backgroundColor: '#f5f5f5',
                    fontFamily: 'monospace',
                    fontSize: '24px',
                    lineHeight: 1.3,
                    maxWidth: '320px',
                    width: '320px',
                    mx: 'auto',
                    boxSizing: 'border-box'
                  }}
                >
                  <Box textAlign="center" mb={1}>
                    <Typography variant="h6" sx={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {systemConfig.restaurantName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      {systemConfig.restaurantAddress}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Tel: {systemConfig.restaurantPhone}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      RUC: {systemConfig.restaurantRuc}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '20px', mb: 1 }}
                    >
                      <strong>Pedido:</strong> {(() => {
                        const [date, number] = selectedSale.orderNumber.split('-')
                        return (
                          <>
                            {date}-<span style={{ fontWeight: 'bold' }}>{number}</span>
                          </>
                        )
                      })()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '20px', mb: 0.5 }}>
                      <strong>Fecha:</strong> {formatDate(selectedSale.createdAt)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '20px', mb: 0.5 }}>
                      <strong>Cajero:</strong> {selectedSale.user.name} {selectedSale.user.lastName}
                    </Typography>
                    {selectedSale.client && (
                      <Typography variant="body2" sx={{ fontSize: '20px', mb: 0.5 }}>
                        <strong>Cliente:</strong> {selectedSale.client.name} {selectedSale.client.lastName}
                      </Typography>
                    )}
                    {(selectedSale.client?.cedula || selectedSale.client?.ruc) && (
                      <Typography variant="body2" sx={{ fontSize: '20px', mb: 0.5 }}>
                        <strong>Doc. Num.:</strong> {selectedSale.client?.cedula || selectedSale.client?.ruc}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '20px', fontWeight: 'bold', mb: 1 }}>
                      PRODUCTOS:
                    </Typography>
                    {selectedSale.items.map((item, index) => (
                      <Box key={index} mb={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1}>
                            <Typography variant="body2" sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                              {item.quantity}x {item.product.name}
                              {item.secondFlavorProductName && (
                                <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                                  {' '}+ {item.secondFlavorProductName}
                                </span>
                              )}
                            </Typography>
                            {item.comments && (
                              <Typography variant="body2" sx={{ fontSize: '18px', color: '#666', fontStyle: 'italic' }}>
                                Nota: {item.comments}
                              </Typography>
                            )}
                            {item.otherIngredient && (
                              <Typography variant="body2" sx={{ fontSize: '18px', color: '#1976d2', fontWeight: 'bold' }}>
                                {item.otherIngredient}
                              </Typography>
                            )}
                            {item.addons && item.addons.length > 0 && (
                              <Box sx={{ ml: 1 }}>
                                {item.addons.map((addon, addonIndex) => (
                                  <Typography key={addonIndex} variant="body2" sx={{ fontSize: '18px', color: '#666' }}>
                                    + {addon.quantity}x {addon.addon.name} = {formatCurrency(addon.addon.price * addon.quantity)}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                            {formatCurrency(item.subtotal)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" sx={{ fontSize: '20px' }}>
                        Subtotal:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '20px' }}>
                        {formatCurrency(selectedSale.items.reduce((sum, item) => sum + Number(item.subtotal), 0))}
                      </Typography>
                    </Box>
                    {selectedSale.discount > 0 && (
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Descuento:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '20px', color: 'red' }}>
                          -{formatCurrency(selectedSale.discount)}
                        </Typography>
                      </Box>
                    )}
                    {selectedSale.deliveryCost > 0 && (
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Delivery:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          {formatCurrency(selectedSale.deliveryCost)}
                        </Typography>
                      </Box>
                    )}
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" sx={{ fontSize: '24px', fontWeight: 'bold' }}>
                        TOTAL:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {formatCurrency(selectedSale.total)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '20px', mb: 0.5 }}>
                      <strong>Tipo de pedido:</strong> {selectedSale.orderType === 'PICKUP' ? 'Pasa a buscar/Para llevar' : 
                                                      selectedSale.orderType === 'DELIVERY' ? 'Delivery' : 'Consumo en local'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '20px', mb: 0.5 }}>
                      <strong>Método de pago:</strong> {getPaymentMethodLabel(selectedSale.paymentMethod)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />
                  <Box textAlign="center">
                    {systemConfig.footerMessage && (
                      <Typography variant="body2" sx={{ fontSize: '20px', mb: 1 }}>
                        {systemConfig.footerMessage}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ fontSize: '18px', color: '#666', mt: 1 }}>
                      BitcanPOS - bitcan.com.py
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTicketDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  )
}
