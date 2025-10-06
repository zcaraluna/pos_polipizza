'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material'
import {
  Assessment,
  Download,
  Print,
  DateRange,
  TrendingUp,
  Inventory,
  AttachMoney,
  People,
} from '@mui/icons-material'
import AppLayout from '@/components/Layout/AppLayout'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface SalesReport {
  totalSales: number
  totalQuantity: number
  salesByHour: Array<{
    hour: number
    sales: number
    quantity: number
  }>
  salesByProduct: Array<{
    productName: string
    quantity: number
    revenue: number
  }>
  salesByUser: Array<{
    userName: string
    sales: number
    quantity: number
  }>
}

interface InventoryReport {
  totalValue: number
  lowStockItems: number
  movements: Array<{
    date: string
    type: string
    ingredientName: string
    quantity: number
    reason?: string
  }>
}

interface CashReport {
  openingBalance: number
  closingBalance: number
  totalSales: number
  totalExtractions: number
  movements: Array<{
    time: string
    type: string
    amount: number
    description?: string
    userName: string
  }>
}

export default function ReportsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Filtros
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [reportType, setReportType] = useState('daily')
  
  // Datos de reportes
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)
  const [cashReport, setCashReport] = useState<CashReport | null>(null)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const fetchSalesReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: startDate?.toISOString() || '',
        endDate: endDate?.toISOString() || '',
        type: reportType
      })
      
      const response = await fetch(`/api/reports/sales?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSalesReport(data)
      } else {
        setError('Error al cargar reporte de ventas')
      }
    } catch (error) {
      setError('Error al cargar reporte de ventas')
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: startDate?.toISOString() || '',
        endDate: endDate?.toISOString() || ''
      })
      
      const response = await fetch(`/api/reports/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInventoryReport(data)
      } else {
        setError('Error al cargar reporte de inventario')
      }
    } catch (error) {
      setError('Error al cargar reporte de inventario')
    } finally {
      setLoading(false)
    }
  }

  const fetchCashReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: startDate?.toISOString() || '',
        endDate: endDate?.toISOString() || ''
      })
      
      const response = await fetch(`/api/reports/cash?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCashReport(data)
      } else {
        setError('Error al cargar reporte de caja')
      }
    } catch (error) {
      setError('Error al cargar reporte de caja')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    switch (tabValue) {
      case 0:
        fetchSalesReport()
        break
      case 1:
        fetchInventoryReport()
        break
      case 2:
        fetchCashReport()
        break
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AppLayout>
      <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              📊 Reportes y Estadísticas
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                disabled={loading}
              >
                Exportar PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
                disabled={loading}
              >
                Imprimir
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Filtros */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗓️ Filtros de Reporte
              </Typography>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Fecha Inicio"
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Fecha Fin"
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Reporte</InputLabel>
                    <Select
                      value={reportType}
                      label="Tipo de Reporte"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <MenuItem value="daily">Diario</MenuItem>
                      <MenuItem value="weekly">Semanal</MenuItem>
                      <MenuItem value="monthly">Mensual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGenerateReport}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                  >
                    Generar Reporte
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs de Reportes */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab 
                  icon={<TrendingUp />} 
                  label="Ventas" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<Inventory />} 
                  label="Inventario" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<AttachMoney />} 
                  label="Caja" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Reporte de Ventas */}
            <TabPanel value={tabValue} index={0}>
              {salesReport ? (
                <Grid container spacing={3}>
                  {/* Resumen */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          📈 Resumen de Ventas
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Total Ventas:</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(salesReport.totalSales)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Total Productos:</Typography>
                          <Typography variant="h6" color="primary">
                            {salesReport.totalQuantity}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Promedio por Venta:</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(salesReport.totalSales / Math.max(salesReport.totalQuantity, 1))}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Top Productos */}
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          🏆 Productos Más Vendidos
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell align="right">Ingresos</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {salesReport.salesByProduct.map((product, index) => (
                                <TableRow key={index}>
                                  <TableCell>{product.productName}</TableCell>
                                  <TableCell align="right">{product.quantity}</TableCell>
                                  <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Ventas por Usuario */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          👥 Ventas por Usuario
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Usuario</TableCell>
                                <TableCell align="right">Ventas</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell align="right">Promedio</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {salesReport.salesByUser.map((user, index) => (
                                <TableRow key={index}>
                                  <TableCell>{user.userName}</TableCell>
                                  <TableCell align="right">{formatCurrency(user.sales)}</TableCell>
                                  <TableCell align="right">{user.quantity}</TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(user.sales / Math.max(user.quantity, 1))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Selecciona un rango de fechas y genera el reporte de ventas
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Reporte de Inventario */}
            <TabPanel value={tabValue} index={1}>
              {inventoryReport ? (
                <Grid container spacing={3}>
                  {/* Resumen */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          📦 Resumen de Inventario
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Valor Total:</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(inventoryReport.totalValue)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Stock Bajo:</Typography>
                          <Chip
                            label={inventoryReport.lowStockItems}
                            color={inventoryReport.lowStockItems > 0 ? 'error' : 'success'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Movimientos */}
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          📋 Movimientos de Inventario
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Ingrediente</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell>Razón</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {inventoryReport.movements.map((movement, index) => (
                                <TableRow key={index}>
                                  <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={movement.type}
                                      color={movement.type === 'ENTRY' ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>{movement.ingredientName}</TableCell>
                                  <TableCell align="right">{movement.quantity}</TableCell>
                                  <TableCell>{movement.reason || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Selecciona un rango de fechas y genera el reporte de inventario
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Reporte de Caja */}
            <TabPanel value={tabValue} index={2}>
              {cashReport ? (
                <Grid container spacing={3}>
                  {/* Resumen */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          💰 Resumen de Caja
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Saldo Inicial:</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(cashReport.openingBalance)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Total Ventas:</Typography>
                          <Typography variant="h6" color="success.main">
                            +{formatCurrency(cashReport.totalSales)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Extracciones:</Typography>
                          <Typography variant="h6" color="error.main">
                            -{formatCurrency(cashReport.totalExtractions)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Saldo Final:</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(cashReport.closingBalance)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Movimientos */}
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          📋 Movimientos de Caja
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Hora</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell align="right">Monto</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Usuario</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cashReport.movements.map((movement, index) => (
                                <TableRow key={index}>
                                  <TableCell>{movement.time}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={movement.type}
                                      color={movement.type === 'SALE' ? 'success' : 'error'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {movement.type === 'SALE' ? '+' : '-'}
                                    {formatCurrency(movement.amount)}
                                  </TableCell>
                                  <TableCell>{movement.description || '-'}</TableCell>
                                  <TableCell>{movement.userName}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Selecciona un rango de fechas y genera el reporte de caja
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Card>
        </Box>
    </AppLayout>
  )
}
