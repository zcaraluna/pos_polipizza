'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Pagination,
} from '@mui/material'
import {
  AccountBalance,
  LockOpen,
  Lock,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  History,
  Receipt,
  List as ListIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AppLayout from '@/components/Layout/AppLayout'
import { generateTicketPDFFromElement } from '@/lib/pdfGenerator'
import { getParaguayDate } from '@/lib/dateUtils'
import { useRouter } from 'next/navigation'

interface CashRegister {
  id: string
  isOpen: boolean
  currentBalance: number
  lastOpenedAt?: string
  lastClosedAt?: string
}

interface CashMovement {
  id: string
  type: string
  amount: number
  description?: string
  createdAt: string
  user: {
    name: string
    lastName: string
  }
}

export default function CashRegisterPage() {
  const router = useRouter()
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [paymentSummary, setPaymentSummary] = useState({
    cash: 0,
    card: 0,
    transfer: 0,
    total: 0,
    sessionInfo: {
      isOpen: false,
      openedAt: null as Date | null,
      closedAt: null as Date | null,
      hoursOpen: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState<'open' | 'close' | 'extract'>('open')
  const [movementsPage, setMovementsPage] = useState(1)
  const [movementsTotal, setMovementsTotal] = useState(0)
  const [showCashTicketPreview, setShowCashTicketPreview] = useState(false)
  const [cashTicketData, setCashTicketData] = useState({
    cash: 0,
    card: 0,
    transfer: 0,
    total: 0,
    date: new Date().toISOString(),
    sessionInfo: {
      isOpen: false,
      openedAt: null as Date | null,
      closedAt: null as Date | null,
      hoursOpen: 0
    },
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantRuc: '',
    footerMessage: ''
  })

  const { control, handleSubmit, reset } = useForm<{
    amount: number
    description: string
  }>()

  useEffect(() => {
    fetchCashRegister()
    fetchPaymentSummary()
  }, [])

  const fetchCashRegister = async (page: number = movementsPage) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cash-register?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setCashRegister(data.cashRegister)
        setMovements(data.movements)
        setMovementsTotal(data.movementsTotal || 0)
        setMovementsPage(page)
      } else {
        setError('Error al cargar la información de la caja')
      }
    } catch (error) {
      setError('Error al cargar la información de la caja')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentSummary = async () => {
    try {
      const response = await fetch('/api/cash-register/summary')
      if (response.ok) {
        const data = await response.json()
        setPaymentSummary(data)
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error)
    }
  }

  const handleGenerateCashTicket = async () => {
    try {
      const response = await fetch('/api/print/cash-ticket')
      if (response.ok) {
        const data = await response.json()
        setCashTicketData(data)
        setShowCashTicketPreview(true)
      } else {
        setError('Error al generar el resumen de caja')
      }
    } catch (error) {
      setError('Error al generar el resumen de caja')
    }
  }

  const handleGeneratePDF = async () => {
    try {
      setActionLoading(true)
      await generateTicketPDFFromElement('cash-ticket-preview', `resumen-caja-${new Date().toISOString().split('T')[0]}.pdf`)
      setShowCashTicketPreview(false)
    } catch (error) {
      setError('Error al generar el PDF')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenDialog = (type: 'open' | 'close' | 'extract') => {
    setDialogType(type)
    setOpenDialog(true)
    reset({
      amount: type === 'open' ? 0 : 0,
      description: '',
    })
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    reset()
  }

  const onSubmit = async (data: { amount: number; description: string }) => {
    setActionLoading(true)
    setError('')

    try {
      let url = ''
      let body: any = {}

      switch (dialogType) {
        case 'open':
          url = '/api/cash-register/open'
          body = { initialAmount: data.amount }
          break
        case 'close':
          url = '/api/cash-register/close'
          body = { finalAmount: data.amount }
          break
        case 'extract':
          url = '/api/cash-register/extract'
          body = { amount: data.amount, description: data.description }
          break
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(
          dialogType === 'open' 
            ? 'Caja abierta exitosamente'
            : dialogType === 'close'
            ? 'Caja cerrada exitosamente'
            : 'Extracción realizada exitosamente'
        )
        handleCloseDialog()
        fetchCashRegister(movementsPage)
        fetchPaymentSummary()
        
        // Si es cierre de caja, mostrar el resumen automáticamente
        if (dialogType === 'close') {
          await handleGenerateCashTicket()
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al realizar la operación')
      }
    } catch (error) {
      setError('Error al realizar la operación')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString('es-PY', { timeZone: 'America/Asuncion' })
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'OPENING':
        return <LockOpen color="success" />
      case 'CLOSING':
        return <Lock color="error" />
      case 'SALE':
        return <TrendingUp color="primary" />
      case 'EXTRACTION':
        return <TrendingDown color="warning" />
      default:
        return <AttachMoney />
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'OPENING':
        return 'Apertura'
      case 'CLOSING':
        return 'Cierre'
      case 'SALE':
        return 'Venta'
      case 'EXTRACTION':
        return 'Extracción'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Gestión de Caja
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => router.push('/cash-tickets')}
          >
            Historial de Tickets
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Cash Register Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalance sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5">Estado de la Caja</Typography>
                </Box>

                <Box mb={2}>
                  <Chip
                    label={cashRegister?.isOpen ? 'Abierta' : 'Cerrada'}
                    color={cashRegister?.isOpen ? 'success' : 'error'}
                    size="medium"
                  />
                </Box>

                <Typography variant="h4" color="primary" gutterBottom>
                  {formatCurrency(Number(cashRegister?.currentBalance || 0))}
                </Typography>

                {cashRegister?.lastOpenedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Última apertura: {formatDate(cashRegister.lastOpenedAt)}
                  </Typography>
                )}

                {cashRegister?.lastClosedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Último cierre: {formatDate(cashRegister.lastClosedAt)}
                  </Typography>
                )}

                <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                  {!cashRegister?.isOpen ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<LockOpen />}
                      onClick={() => handleOpenDialog('open')}
                    >
                      Abrir Caja
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<TrendingDown />}
                        onClick={() => handleOpenDialog('extract')}
                      >
                        Extraer Dinero
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Receipt />}
                        onClick={() => handleOpenDialog('close')}
                      >
                        Cerrar Caja y Generar Resumen
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AttachMoney sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5">Resumen de la Jornada</Typography>
                </Box>

                {/* Información de la jornada */}
                {paymentSummary.sessionInfo.openedAt && (
                  <Box mb={2} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Información de la Jornada:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Apertura:</strong> {formatDate(paymentSummary.sessionInfo.openedAt)}
                    </Typography>
                    {paymentSummary.sessionInfo.closedAt && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cierre:</strong> {formatDate(paymentSummary.sessionInfo.closedAt)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>Horas de apertura:</strong> {formatHours(paymentSummary.sessionInfo.hoursOpen)}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.contrastText">
                        Efectivo
                      </Typography>
                      <Typography variant="h6" color="success.contrastText" fontWeight="bold">
                        {formatCurrency(paymentSummary.cash)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary.contrastText">
                        Tarjeta
                      </Typography>
                      <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
                        {formatCurrency(paymentSummary.card)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="info.contrastText">
                        Transferencia
                      </Typography>
                      <Typography variant="h6" color="info.contrastText" fontWeight="bold">
                        {formatCurrency(paymentSummary.transfer)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="body2" color="grey.700">
                        Total
                      </Typography>
                      <Typography variant="h6" color="grey.700" fontWeight="bold">
                        {formatCurrency(paymentSummary.total)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Movements */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <History sx={{ mr: 1, fontSize: 40 }} />
                  <Typography variant="h5">Movimientos Recientes</Typography>
                </Box>

                {movements.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center">
                    No hay movimientos registrados
                  </Typography>
                ) : (
                  <List>
                    {movements.map((movement) => (
                      <ListItem key={movement.id} divider>
                        <ListItemIcon>
                          {getMovementIcon(movement.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1">
                                {getMovementLabel(movement.type)}
                              </Typography>
                              <Typography
                                variant="body1"
                                color={
                                  movement.type === 'SALE' || movement.type === 'OPENING'
                                    ? 'primary'
                                    : 'error'
                                }
                              >
                                {movement.type === 'SALE' || movement.type === 'OPENING'
                                  ? `+${formatCurrency(movement.amount)}`
                                  : `-${formatCurrency(movement.amount)}`
                                }
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {movement.description}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {movement.user.name} {movement.user.lastName} - {formatDate(movement.createdAt)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* Pagination */}
                {movementsTotal > 10 && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={Math.ceil(movementsTotal / 10)}
                      page={movementsPage}
                      onChange={(event, page) => fetchCashRegister(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogType === 'open' && 'Abrir Caja'}
            {dialogType === 'close' && 'Cerrar Caja y Generar Resumen'}
            {dialogType === 'extract' && 'Extraer Dinero'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Controller
                name="amount"
                control={control}
                rules={{ 
                  required: 'El monto es requerido',
                  min: { value: 0, message: 'El monto debe ser mayor o igual a 0' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={
                      dialogType === 'open' 
                        ? 'Monto Inicial (PYG)'
                        : dialogType === 'close'
                        ? 'Monto Final (PYG)'
                        : 'Monto a Extraer (PYG)'
                    }
                    type="number"
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 0 }}
                  />
                )}
              />

              {dialogType === 'extract' && (
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Motivo de la extracción"
                      fullWidth
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  )}
                />
              )}

              {dialogType === 'close' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Ingrese el monto final que queda en la caja después del conteo físico. 
                  Al cerrar la caja se generará automáticamente el resumen del día.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  dialogType === 'open' 
                    ? 'Abrir Caja'
                    : dialogType === 'close'
                    ? 'Cerrar Caja y Generar Resumen'
                    : 'Extraer Dinero'
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Cash Ticket Preview Dialog */}
        <Dialog 
          open={showCashTicketPreview} 
          onClose={() => setShowCashTicketPreview(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Resumen de Caja - Vista Previa</DialogTitle>
          <DialogContent>
            <Paper 
              id="cash-ticket-preview"
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
                  {cashTicketData.restaurantName || 'Polipizza'}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '20px' }}>
                  {cashTicketData.restaurantAddress || 'Dirección del restaurante'}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '20px' }}>
                  Tel: {cashTicketData.restaurantPhone || '+595 21 123 456'}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '20px' }}>
                  RUC: {cashTicketData.restaurantRuc || '12345678-9'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="body2" sx={{ fontSize: '20px' }}>
                  Fecha: {new Date(cashTicketData.date).toLocaleString('es-PY', { timeZone: 'America/Asuncion', hour12: false })}
                </Typography>
                {cashTicketData.sessionInfo.openedAt && (
                  <>
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Apertura: {new Date(cashTicketData.sessionInfo.openedAt).toLocaleString('es-PY', { timeZone: 'America/Asuncion', hour12: false })}
                    </Typography>
                    {cashTicketData.sessionInfo.closedAt && (
                      <Typography variant="body2" sx={{ fontSize: '20px' }}>
                        Cierre: {new Date(cashTicketData.sessionInfo.closedAt).toLocaleString('es-PY', { timeZone: 'America/Asuncion', hour12: false })}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Horas: {formatHours(cashTicketData.sessionInfo.hoursOpen)}
                    </Typography>
                  </>
                )}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="body2" sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                  RESUMEN DE LA JORNADA:
                </Typography>
                {cashTicketData.cash > 0 && (
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Efectivo: {formatCurrency(cashTicketData.cash)}
                  </Typography>
                )}
                {cashTicketData.card > 0 && (
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Tarjeta: {formatCurrency(cashTicketData.card)}
                  </Typography>
                )}
                {cashTicketData.transfer > 0 && (
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Transferencia: {formatCurrency(cashTicketData.transfer)}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="body2" sx={{ fontSize: '28px', fontWeight: 'bold' }}>
                  TOTAL: {formatCurrency(cashTicketData.total)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box textAlign="center">
                <Typography variant="body2" sx={{ fontSize: '18px', color: '#666', mt: 1, fontWeight: 'bold' }}>
                  BitcanPOS - bitcan.com.py
                </Typography>
              </Box>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCashTicketPreview(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={actionLoading}
              onClick={handleGeneratePDF}
            >
              {actionLoading ? (
                <CircularProgress size={20} />
              ) : (
                'Generar PDF'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  )
}


