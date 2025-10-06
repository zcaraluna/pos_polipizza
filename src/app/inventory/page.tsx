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
  Alert,
  CircularProgress,
  Chip,
  Pagination,
  InputAdornment,
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
  Search,
  Inventory,
  TrendingUp,
  TrendingDown,
  Warning,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AppLayout from '@/components/Layout/AppLayout'
import { IngredientData } from '@/types'

interface Ingredient {
  id: string
  name: string
  description?: string
  unit: string
  minStock: number
  currentStock: number
  cost: number
  isActive: boolean
  createdAt: string
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openMovementDialog, setOpenMovementDialog] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<IngredientData>()
  const { control: movementControl, handleSubmit: handleMovementSubmit, reset: resetMovement } = useForm()

  useEffect(() => {
    fetchIngredients()
  }, [page, searchTerm, lowStockFilter])

  const fetchIngredients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(lowStockFilter && { lowStock: 'true' }),
      })
      
      const response = await fetch(`/api/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setIngredients(data.ingredients)
        setTotalPages(data.pagination.pages)
      } else {
        setError('Error al cargar el inventario')
      }
    } catch (error) {
      setError('Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient)
      reset({
        name: ingredient.name,
        description: ingredient.description || '',
        unit: ingredient.unit,
        minStock: Number(ingredient.minStock),
        currentStock: Number(ingredient.currentStock),
        cost: Number(ingredient.cost),
      })
    } else {
      setEditingIngredient(null)
      reset({
        name: '',
        description: '',
        unit: 'kg',
        minStock: 0,
        currentStock: 0,
        cost: 0,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingIngredient(null)
    reset()
  }

  const handleOpenMovementDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    resetMovement({
      type: 'ENTRY',
      quantity: 0,
      reason: '',
    })
    setOpenMovementDialog(true)
  }

  const handleCloseMovementDialog = () => {
    setOpenMovementDialog(false)
    setSelectedIngredient(null)
    resetMovement()
  }

  const onSubmit = async (data: IngredientData) => {
    try {
      const url = editingIngredient ? `/api/inventory/${editingIngredient.id}` : '/api/inventory'
      const method = editingIngredient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        handleCloseDialog()
        fetchIngredients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar el ingrediente')
      }
    } catch (error) {
      setError('Error al guardar el ingrediente')
    }
  }

  const onMovementSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredientId: selectedIngredient?.id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
        }),
      })

      if (response.ok) {
        handleCloseMovementDialog()
        fetchIngredients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al registrar el movimiento')
      }
    } catch (error) {
      setError('Error al registrar el movimiento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingrediente?')) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchIngredients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar el ingrediente')
      }
    } catch (error) {
      setError('Error al eliminar el ingrediente')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return { status: 'error', label: 'Bajo' }
    if (current <= min * 1.5) return { status: 'warning', label: 'Medio' }
    return { status: 'success', label: 'Alto' }
  }

  if (loading && ingredients.length === 0) {
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
          <Typography variant="h4">Gestión de Inventario</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Ingrediente
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box display="flex" gap={2} mb={3}>
          <TextField
            placeholder="Buscar ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
              />
            }
            label="Solo stock bajo"
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ingrediente</TableCell>
                <TableCell>Stock Actual</TableCell>
                <TableCell>Stock Mínimo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Costo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredients.map((ingredient) => {
                const stockStatus = getStockStatus(Number(ingredient.currentStock), Number(ingredient.minStock))
                return (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Inventory sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body1">{ingredient.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ingredient.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6">
                        {ingredient.currentStock} {ingredient.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {ingredient.minStock} {ingredient.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stockStatus.label}
                        color={stockStatus.status as any}
                        size="small"
                        icon={stockStatus.status === 'error' ? <Warning /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(Number(ingredient.cost))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenMovementDialog(ingredient)}
                        title="Registrar movimiento"
                      >
                        {Number(ingredient.currentStock) <= Number(ingredient.minStock) ? 
                          <TrendingUp /> : <TrendingDown />
                        }
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(ingredient)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(ingredient.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
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

        {/* Add/Edit Ingredient Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'El nombre es requerido' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre del Ingrediente"
                    fullWidth
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    fullWidth
                    margin="normal"
                    multiline
                    rows={2}
                  />
                )}
              />

              <Box display="flex" gap={2}>
                <Controller
                  name="unit"
                  control={control}
                  rules={{ required: 'La unidad es requerida' }}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Unidad</InputLabel>
                      <Select
                        {...field}
                        label="Unidad"
                      >
                        <MenuItem value="kg">Kilogramos (kg)</MenuItem>
                        <MenuItem value="g">Gramos (g)</MenuItem>
                        <MenuItem value="l">Litros (l)</MenuItem>
                        <MenuItem value="ml">Mililitros (ml)</MenuItem>
                        <MenuItem value="unidades">Unidades</MenuItem>
                        <MenuItem value="paquetes">Paquetes</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="cost"
                  control={control}
                  rules={{ min: { value: 0, message: 'El costo debe ser mayor o igual a 0' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Costo por unidad (PYG)"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!errors.cost}
                      helperText={errors.cost?.message}
                    />
                  )}
                />
              </Box>

              <Box display="flex" gap={2}>
                <Controller
                  name="minStock"
                  control={control}
                  rules={{ 
                    required: 'El stock mínimo es requerido',
                    min: { value: 0, message: 'El stock mínimo debe ser mayor o igual a 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stock Mínimo"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!errors.minStock}
                      helperText={errors.minStock?.message}
                    />
                  )}
                />

                <Controller
                  name="currentStock"
                  control={control}
                  rules={{ 
                    required: 'El stock actual es requerido',
                    min: { value: 0, message: 'El stock actual debe ser mayor o igual a 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stock Actual"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!errors.currentStock}
                      helperText={errors.currentStock?.message}
                    />
                  )}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                {editingIngredient ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Movement Dialog */}
        <Dialog open={openMovementDialog} onClose={handleCloseMovementDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Registrar Movimiento - {selectedIngredient?.name}
          </DialogTitle>
          <form onSubmit={handleMovementSubmit(onMovementSubmit)}>
            <DialogContent>
              <Controller
                name="type"
                control={movementControl}
                rules={{ required: 'El tipo es requerido' }}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Tipo de Movimiento</InputLabel>
                    <Select
                      {...field}
                      label="Tipo de Movimiento"
                    >
                      <MenuItem value="ENTRY">Entrada</MenuItem>
                      <MenuItem value="EXIT">Salida</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="quantity"
                control={movementControl}
                rules={{ 
                  required: 'La cantidad es requerida',
                  min: { value: 0.01, message: 'La cantidad debe ser mayor a 0' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cantidad"
                    type="number"
                    fullWidth
                    margin="normal"
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />

              <Controller
                name="reason"
                control={movementControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Motivo (opcional)"
                    fullWidth
                    margin="normal"
                    multiline
                    rows={2}
                  />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseMovementDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                Registrar Movimiento
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AppLayout>
  )
}


