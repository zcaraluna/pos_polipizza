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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
  PersonAdd,
  Security,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AppLayout from '@/components/Layout/AppLayout'
import { UserRole } from '@/types'

interface User {
  id: string
  name: string
  lastName: string
  username: string
  email: string
  cedula: string
  phone: string
  address: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

interface UserFormData {
  name: string
  lastName: string
  username: string
  email: string
  cedula: string
  phone: string
  address: string
  role: UserRole
  password?: string
  isActive: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<UserFormData>()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      setError('Error al cargar usuarios')
    }
  }

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      reset({
        name: user.name,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        cedula: user.cedula,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
      })
    } else {
      setEditingUser(null)
      reset({
        name: '',
        lastName: '',
        username: '',
        email: '',
        cedula: '',
        phone: '',
        address: '',
        role: 'USER',
        isActive: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
    reset()
  }

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSuccess(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
        fetchUsers()
        handleCloseDialog()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al procesar la solicitud')
      }
    } catch (error) {
      setError('Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Usuario eliminado correctamente')
        fetchUsers()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      setError('Error al eliminar usuario')
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SYSADMIN':
        return 'error'
      case 'ADMIN':
        return 'warning'
      case 'USER':
        return 'success'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SYSADMIN':
        return 'Super Admin'
      case 'ADMIN':
        return 'Administrador'
      case 'USER':
        return 'Usuario'
      default:
        return role
    }
  }

  return (
    <AppLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            👥 Gestión de Usuarios
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Usuario
          </Button>
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
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Person sx={{ mr: 1, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body1">
                              {user.name} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.cedula}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                          icon={
                            user.role === 'SYSADMIN' ? <AdminPanelSettings /> :
                            user.role === 'ADMIN' ? <Security /> : <Person />
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Activo' : 'Inactivo'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Dialog para crear/editar usuario */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
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
                </Grid>
                <Grid item xs={12} sm={6}>
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="username"
                    control={control}
                    rules={{ required: 'El nombre de usuario es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nombre de Usuario"
                        fullWidth
                        error={!!errors.username}
                        helperText={errors.username?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="email"
                    control={control}
                    rules={{ 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email"
                        type="email"
                        fullWidth
                        error={!!errors.email}
                        helperText={errors.email?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="cedula"
                    control={control}
                    rules={{ required: 'La cédula es requerida' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Cédula"
                        fullWidth
                        error={!!errors.cedula}
                        helperText={errors.cedula?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{ required: 'El teléfono es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Teléfono"
                        fullWidth
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="address"
                    control={control}
                    rules={{ required: 'La dirección es requerida' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Dirección"
                        fullWidth
                        multiline
                        rows={2}
                        error={!!errors.address}
                        helperText={errors.address?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: 'El rol es requerido' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.role}>
                        <InputLabel>Rol</InputLabel>
                        <Select
                          {...field}
                          label="Rol"
                        >
                          <MenuItem value="USER">Usuario</MenuItem>
                          <MenuItem value="ADMIN">Administrador</MenuItem>
                          <MenuItem value="SYSADMIN">Super Administrador</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Usuario Activo"
                      />
                    )}
                  />
                </Grid>
                {!editingUser && (
                  <Grid item xs={12}>
                    <Controller
                      name="password"
                      control={control}
                      rules={{ 
                        required: 'La contraseña es requerida',
                        minLength: {
                          value: 6,
                          message: 'La contraseña debe tener al menos 6 caracteres'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Contraseña"
                          type="password"
                          fullWidth
                          error={!!errors.password}
                          helperText={errors.password?.message}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
              >
                {loading ? 'Procesando...' : (editingUser ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AppLayout>
  )
}


