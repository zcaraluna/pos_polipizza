'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material'
import {
  TrendingUp,
  People,
  AccountBalance,
  Restaurant,
  Warning,
  AttachMoney,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/Layout/AppLayout'
import { DashboardStats } from '@/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Error al cargar las estadísticas')
      }
    } catch (error) {
      setError('Error al cargar las estadísticas')
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
        </Box>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchStats}>
            Reintentar
          </Button>
        }>
          {error}
        </Alert>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          ¡Bienvenido, {user?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Resumen del día - {new Date().toLocaleDateString('es-PY')}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Total Sales Today */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Ventas del Día
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(stats?.totalSalesToday || 0)}
                    </Typography>
                  </Box>
                  <AttachMoney color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* New Clients Today */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Clientes Nuevos
                    </Typography>
                    <Typography variant="h4">
                      {stats?.newClientsToday || 0}
                    </Typography>
                  </Box>
                  <People color="secondary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Cash Register Status */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Estado de Caja
                    </Typography>
                    <Chip
                      label={stats?.cashRegisterStatus.isOpen ? 'Abierta' : 'Cerrada'}
                      color={stats?.cashRegisterStatus.isOpen ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {formatCurrency(stats?.cashRegisterStatus.currentBalance || 0)}
                    </Typography>
                  </Box>
                  <AccountBalance color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alerts */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Alertas de Stock
                    </Typography>
                    <Typography variant="h4">
                      {stats?.lowStockAlerts.length || 0}
                    </Typography>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productos Más Vendidos
                </Typography>
                {stats?.topProducts.length ? (
                  <List>
                    {stats.topProducts.map((product, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <Restaurant />
                        </ListItemIcon>
                        <ListItemText
                          primary={product.name}
                          secondary={`${product.quantity} unidades - ${formatCurrency(product.revenue)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No hay ventas registradas hoy
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alerts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas de Stock Bajo
                </Typography>
                {stats?.lowStockAlerts.length ? (
                  <List>
                    {stats.lowStockAlerts.map((alert, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.name}
                          secondary={`Stock actual: ${alert.currentStock} (Mínimo: ${alert.minStock})`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    Todos los productos tienen stock suficiente
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppLayout>
  )
}


