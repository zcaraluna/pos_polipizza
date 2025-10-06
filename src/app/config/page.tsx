'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material'
import {
  Settings,
  Business,
  Receipt,
  Security,
  Backup,
  Print,
  Save,
  Refresh,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface SystemConfig {
  restaurantName: string
  restaurantAddress: string
  restaurantPhone: string
  restaurantRuc: string
  ivaRate: number
  printerIp: string
  printerPort: number
  paperWidth: number
  logoUrl?: string
  footerMessage?: string
  passwordExpiryDays: number
  maxFailedAttempts: number
  sessionTimeoutMinutes: number
  enableAuditLog: boolean
  autoBackup: boolean
  backupFrequency: string
}

export default function ConfigPage() {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [config, setConfig] = useState<SystemConfig | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<SystemConfig>()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        reset(data)
      }
    } catch (error) {
      setError('Error al cargar configuración')
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const onSubmit = async (data: SystemConfig) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSuccess('Configuración actualizada correctamente')
        setConfig(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar configuración')
      }
    } catch (error) {
      setError('Error al actualizar configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/config/backup', {
        method: 'POST',
      })

      if (response.ok) {
        setSuccess('Respaldo creado correctamente')
      } else {
        setError('Error al crear respaldo')
      }
    } catch (error) {
      setError('Error al crear respaldo')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('¿Estás seguro de que deseas restaurar la configuración? Esto sobrescribirá la configuración actual.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/config/restore', {
        method: 'POST',
      })

      if (response.ok) {
        setSuccess('Configuración restaurada correctamente')
        fetchConfig()
      } else {
        setError('Error al restaurar configuración')
      }
    } catch (error) {
      setError('Error al restaurar configuración')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            ⚙️ Configuración del Sistema
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Backup />}
              onClick={handleBackup}
              disabled={loading}
            >
              Respaldo
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRestore}
              disabled={loading}
            >
              Restaurar
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab 
                icon={<Business />} 
                label="Empresa" 
                iconPosition="start"
              />
              <Tab 
                icon={<Receipt />} 
                label="Facturación" 
                iconPosition="start"
              />
              <Tab 
                icon={<Print />} 
                label="Impresora" 
                iconPosition="start"
              />
              <Tab 
                icon={<Security />} 
                label="Seguridad" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Configuración de Empresa */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="restaurantName"
                    control={control}
                    rules={{ required: 'El nombre del restaurante es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nombre del Restaurante"
                        variant="outlined"
                        fullWidth
                        error={!!errors.restaurantName}
                        helperText={errors.restaurantName?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="restaurantRuc"
                    control={control}
                    rules={{ required: 'El RUC es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="RUC"
                        variant="outlined"
                        fullWidth
                        error={!!errors.restaurantRuc}
                        helperText={errors.restaurantRuc?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="restaurantAddress"
                    control={control}
                    rules={{ required: 'La dirección es requerida' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Dirección"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        error={!!errors.restaurantAddress}
                        helperText={errors.restaurantAddress?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="restaurantPhone"
                    control={control}
                    rules={{ required: 'El teléfono es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Teléfono"
                        variant="outlined"
                        fullWidth
                        error={!!errors.restaurantPhone}
                        helperText={errors.restaurantPhone?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="logoUrl"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="URL del Logo"
                        variant="outlined"
                        fullWidth
                        helperText="URL de la imagen del logo para tickets"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="footerMessage"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mensaje del Pie de Página"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        helperText="Mensaje que aparecerá al final de los tickets"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Configuración de Facturación */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="ivaRate"
                    control={control}
                    rules={{ 
                      required: 'La tasa de IVA es requerida',
                      min: { value: 0, message: 'La tasa debe ser mayor o igual a 0' },
                      max: { value: 100, message: 'La tasa debe ser menor o igual a 100' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Tasa de IVA (%)"
                        variant="outlined"
                        type="number"
                        fullWidth
                        error={!!errors.ivaRate}
                        helperText={errors.ivaRate?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      La tasa de IVA se aplicará automáticamente a las facturas que lo requieran.
                      Actualmente configurado al {config?.ivaRate || 10}%.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Configuración de Impresora */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="printerIp"
                    control={control}
                    rules={{ required: 'La IP de la impresora es requerida' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="IP de la Impresora"
                        variant="outlined"
                        fullWidth
                        error={!!errors.printerIp}
                        helperText={errors.printerIp?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="printerPort"
                    control={control}
                    rules={{ required: 'El puerto es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Puerto"
                        variant="outlined"
                        type="number"
                        fullWidth
                        error={!!errors.printerPort}
                        helperText={errors.printerPort?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="paperWidth"
                    control={control}
                    rules={{ required: 'El ancho del papel es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ancho del Papel (mm)"
                        variant="outlined"
                        type="number"
                        fullWidth
                        error={!!errors.paperWidth}
                        helperText={errors.paperWidth?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.open('/api/print/test', '_blank')}
                  >
                    Probar Impresora
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Configuración de Seguridad */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="passwordExpiryDays"
                    control={control}
                    rules={{ required: 'Los días de expiración son requeridos' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Días de Expiración de Contraseña"
                        variant="outlined"
                        type="number"
                        fullWidth
                        error={!!errors.passwordExpiryDays}
                        helperText={errors.passwordExpiryDays?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="maxFailedAttempts"
                    control={control}
                    rules={{ required: 'El número máximo de intentos es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Máximo Intentos Fallidos"
                        variant="outlined"
                        type="number"
                        fullWidth
                        error={!!errors.maxFailedAttempts}
                        helperText={errors.maxFailedAttempts?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="sessionTimeoutMinutes"
                    control={control}
                    rules={{ required: 'El tiempo de sesión es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Tiempo de Sesión (minutos)"
                        variant="outlined"
                        type="number"
                        fullWidth
                        error={!!errors.sessionTimeoutMinutes}
                        helperText={errors.sessionTimeoutMinutes?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="autoBackup"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Respaldo Automático"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="backupFrequency"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Frecuencia de Respaldo"
                        variant="outlined"
                        fullWidth
                        select
                        SelectProps={{ native: true }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="enableAuditLog"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Habilitar Auditoría"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <Divider />
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </Box>
          </form>
        </Card>
      </Box>
    </AppLayout>
  )
}


