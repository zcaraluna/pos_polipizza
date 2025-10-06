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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Restaurant,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AppLayout from '@/components/Layout/AppLayout'
import { ProductData, ProductStatus } from '@/types'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(amount)
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  status: ProductStatus
  stock?: number | null
  createdAt: string
  productIngredients: Array<{
    id: string
    quantity: number
    ingredient: {
      id: string
      name: string
    }
  }>
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProductData>()

  useEffect(() => {
    fetchProducts()
  }, [page, searchTerm, statusFilter])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      })
      
      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        setTotalPages(data.pagination.pages)
      } else {
        setError('Error al cargar los productos')
      }
    } catch (error) {
      setError('Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      reset({
        name: product.name,
        description: product.description || '',
        price: Number(product.price),
        category: product.category,
        status: product.status,
        stock: product.stock,
      })
    } else {
      setEditingProduct(null)
      reset({
        name: '',
        description: '',
        price: 0,
        category: '',
        status: 'ACTIVE',
        stock: null,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingProduct(null)
    reset()
  }

  const onSubmit = async (data: ProductData) => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        handleCloseDialog()
        fetchProducts()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar el producto')
      }
    } catch (error) {
      setError('Error al guardar el producto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchProducts()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar el producto')
      }
    } catch (error) {
      setError('Error al eliminar el producto')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading && products.length === 0) {
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
          <Typography variant="h4">Catálogo de Productos</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Producto
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box display="flex" gap={2} mb={3}>
          <TextField
            placeholder="Buscar productos..."
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
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Estado"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVE">Activo</MenuItem>
              <MenuItem value="INACTIVE">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Restaurant sx={{ mr: 1, color: 'text.secondary' }} />
                      {product.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.category}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {product.description || 'Sin descripción'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(Number(product.price))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {product.stock === null || product.stock === undefined ? 'X' : product.stock}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      color={product.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(product.id)}
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

        {/* Add/Edit Product Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                    label="Nombre del Producto"
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
                    rows={3}
                  />
                )}
              />

              <Controller
                name="category"
                control={control}
                rules={{ required: 'La categoría es requerida' }}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      {...field}
                      label="Categoría"
                      error={!!errors.category}
                    >
                      <MenuItem value="Pizzas">Pizzas</MenuItem>
                      <MenuItem value="Pizzas Borde Relleno">Pizzas Borde Relleno</MenuItem>
                      <MenuItem value="Hamburguesas">Hamburguesas</MenuItem>
                      <MenuItem value="Lomitos">Lomitos</MenuItem>
                      <MenuItem value="Papas">Papas</MenuItem>
                      <MenuItem value="Bebidas sin alcohol">Bebidas sin alcohol</MenuItem>
                      <MenuItem value="Cervezas">Cervezas</MenuItem>
                      <MenuItem value="Cócteles">Cócteles</MenuItem>
                      <MenuItem value="Otros">Otros</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Box display="flex" gap={2}>
                <Controller
                  name="price"
                  control={control}
                  rules={{ 
                    required: 'El precio es requerido',
                    min: { value: 0, message: 'El precio debe ser mayor a 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Precio (PYG)"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={!!errors.price}
                      helperText={errors.price?.message}
                    />
                  )}
                />

                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Stock"
                      type="number"
                      fullWidth
                      margin="normal"
                      helperText="Dejar vacío para stock ilimitado"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? null : parseInt(value))
                      }}
                    />
                  )}
                />
              </Box>

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      {...field}
                      label="Estado"
                    >
                      <MenuItem value="ACTIVE">Activo</MenuItem>
                      <MenuItem value="INACTIVE">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">
                {editingProduct ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AppLayout>
  )
}
