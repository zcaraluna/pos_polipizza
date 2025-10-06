'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  Pagination,
  InputAdornment,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  Email,
  Phone,
  Badge,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AppLayout from '@/components/Layout/AppLayout'
import { ClientData } from '@/types'

interface Client {
  id: string
  name: string
  lastName: string
  email?: string
  phone?: string
  cedula?: string
  ruc?: string
  requiresInvoice: boolean
  isActive: boolean
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClientData>()

  useEffect(() => {
    fetchClients()
  }, [page, searchTerm])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      })
      
      const response = await fetch(`/api/clients?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
        setTotalPages(data.pagination.pages)
      } else {
        setError('Error al cargar los clientes')
      }
    } catch (error) {
      setError('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      reset({
        name: client.name,
        lastName: client.lastName,
        email: client.email || '',
        phone: client.phone || '',
        cedula: client.cedula || '',
        ruc: client.ruc || '',
        requiresInvoice: client.requiresInvoice,
      })
    } else {
      setEditingClient(null)
      reset({
        name: '',
        lastName: '',
        email: '',
        phone: '',
        cedula: '',
        ruc: '',
        requiresInvoice: false,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingClient(null)
    reset()
  }

  const onSubmit = async (data: ClientData) => {
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        handleCloseDialog()
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar el cliente')
      }
    } catch (error) {
      setError('Error al guardar el cliente')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar el cliente')
      }
    } catch (error) {
      setError('Error al eliminar el cliente')
    }
  }

  if (loading && clients.length === 0) {
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
          <Typography variant="h4">Gestión de Clientes</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Cliente
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Buscar clientes por nombre, email, teléfono, cédula o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Factura</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      {client.name} {client.lastName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {client.email && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{client.email}</Typography>
                        </Box>
                      )}
                      {client.phone && (
                        <Box display="flex" alignItems="center">
                          <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{client.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {client.cedula && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Badge sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">CI: {client.cedula}</Typography>
                        </Box>
                      )}
                      {client.ruc && (
                        <Box display="flex" alignItems="center">
                          <Badge sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">RUC: {client.ruc}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.requiresInvoice ? 'Sí' : 'No'}
                      color={client.requiresInvoice ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.isActive ? 'Activo' : 'Inactivo'}
                      color={client.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(client)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Add/Edit Client Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Box display="flex" gap={2} mb={2}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'El nombre es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nombre"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: 'El apellido es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Apellido"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Teléfono"
                      fullWidth
                    />
                  )}
                />
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <Controller
                  name="cedula"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cédula"
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="ruc"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="RUC"
                      fullWidth
                    />
                  )}
                />
              </Box>

              <Controller
                name="requiresInvoice"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="Requiere factura"
                  />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                {editingClient ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AppLayout>
  )
}


