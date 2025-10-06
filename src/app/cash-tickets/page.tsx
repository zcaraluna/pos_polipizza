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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Pagination,
  IconButton,
} from '@mui/material'
import {
  Receipt,
  Print,
  Refresh,
} from '@mui/icons-material'
import AppLayout from '@/components/Layout/AppLayout'
import { generateTicketPDFFromElement } from '@/lib/pdfGenerator'

interface CashTicket {
  id: string
  openedAt: string
  closedAt: string | null
  hoursOpen: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
  totalSales: number
  createdAt: string
  user: {
    name: string
    lastName: string
  }
}

export default function CashTicketsPage() {
  const [tickets, setTickets] = useState<CashTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<CashTicket | null>(null)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [systemConfig, setSystemConfig] = useState({
    restaurantName: 'Polipizza',
    restaurantAddress: 'Dirección del restaurante',
    restaurantPhone: '+595 21 123 456',
    restaurantRuc: '12345678-9',
  })

  useEffect(() => {
    fetchTickets()
    fetchSystemConfig()
  }, [page])

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
        })
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cash-tickets?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        setError('Error al cargar el historial de tickets')
      }
    } catch (error) {
      setError('Error al cargar el historial de tickets')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PY', { 
      timeZone: 'America/Asuncion',
      hour12: false 
    })
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const handleViewTicket = (ticket: CashTicket) => {
    setSelectedTicket(ticket)
    setTicketDialogOpen(true)
  }

  const handleGeneratePDF = async () => {
    if (!selectedTicket) return

    setGeneratingPDF(true)
    try {
      await generateTicketPDFFromElement('cash-ticket-preview', `ticket-caja-${selectedTicket.id}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPDF(false)
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
            Historial de Tickets de Caja
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTickets}
          >
            Actualizar
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha de Cierre</TableCell>
                    <TableCell>Cajero</TableCell>
                    <TableCell>Horas</TableCell>
                    <TableCell>Efectivo</TableCell>
                    <TableCell>Tarjeta</TableCell>
                    <TableCell>Transferencia</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        {ticket.closedAt ? formatDate(ticket.closedAt) : 'En curso'}
                      </TableCell>
                      <TableCell>
                        {ticket.user.name} {ticket.user.lastName}
                      </TableCell>
                      <TableCell>
                        {formatHours(ticket.hoursOpen)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(ticket.cashTotal)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(ticket.cardTotal)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(ticket.transferTotal)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(ticket.totalSales)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <Receipt />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Ticket Preview Dialog */}
        <Dialog 
          open={ticketDialogOpen} 
          onClose={() => setTicketDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Ticket de Caja - Vista Previa</DialogTitle>
          <DialogContent>
            {selectedTicket && (
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
                <Box sx={{ my: 1, borderTop: '1px solid #000', borderBottom: '1px solid #000', py: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Fecha: {formatDate(selectedTicket.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Apertura: {formatDate(selectedTicket.openedAt)}
                  </Typography>
                  {selectedTicket.closedAt && (
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Cierre: {formatDate(selectedTicket.closedAt)}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Horas: {formatHours(selectedTicket.hoursOpen)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '20px' }}>
                    Cajero: {selectedTicket.user.name} {selectedTicket.user.lastName}
                  </Typography>
                </Box>
                <Box sx={{ my: 1, borderTop: '1px solid #000', borderBottom: '1px solid #000', py: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                    RESUMEN DE LA JORNADA:
                  </Typography>
                  {selectedTicket.cashTotal > 0 && (
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Efectivo: {formatCurrency(selectedTicket.cashTotal)}
                    </Typography>
                  )}
                  {selectedTicket.cardTotal > 0 && (
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Tarjeta: {formatCurrency(selectedTicket.cardTotal)}
                    </Typography>
                  )}
                  {selectedTicket.transferTotal > 0 && (
                    <Typography variant="body2" sx={{ fontSize: '20px' }}>
                      Transferencia: {formatCurrency(selectedTicket.transferTotal)}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ my: 1, borderTop: '1px solid #000', borderBottom: '1px solid #000', py: 1 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '28px', fontWeight: 'bold' }}>
                    TOTAL: {formatCurrency(selectedTicket.totalSales)}
                  </Typography>
                </Box>
                <Box sx={{ my: 1, borderTop: '1px solid #000', borderBottom: '1px solid #000', py: 1 }} />
                <Box textAlign="center">
                  <Typography variant="body2" sx={{ fontSize: '18px', color: '#666', mt: 1, fontWeight: 'bold' }}>
                    BitcanPOS - bitcan.com.py
                  </Typography>
                </Box>
              </Paper>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTicketDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Print />}
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? 'Generando...' : 'Imprimir PDF'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  )
}

