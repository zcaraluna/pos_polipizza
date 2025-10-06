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
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Person,
  AttachMoney,
  Print,
  Search,
  ExpandMore,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import AppLayout from '@/components/Layout/AppLayout'
import { SaleData, SaleItem, SaleItemAddon, ClientData, ProductData } from '@/types'
import { generateTicketPDFFromElement } from '@/lib/pdfGenerator'
import { generateQRCodeForTicket } from '@/lib/qrGenerator'
import { useAuth } from '@/contexts/AuthContext'
import { getParaguayDate, generateOrderNumber } from '@/lib/dateUtils'

const DELIVERY_COST_OPTIONS = [
  { label: 'GRATIS', value: 0 },
  { label: '5.000 Gs', value: 5000 },
  { label: '8.000 Gs', value: 8000 },
  { label: '10.000 Gs', value: 10000 },
  { label: '15.000 Gs', value: 15000 },
  { label: '20.000 Gs', value: 20000 },
]

interface CartItem extends SaleItem {
  productName: string
  addons?: SaleItemAddon[]
  secondFlavor?: {
    productId: string
    productName: string
    price: number
  }
  comments?: string
  otherIngredient?: string
}

interface Client {
  id: string
  name: string
  lastName: string
  cedula?: string
  ruc?: string
  email?: string
  phone?: string
  requiresInvoice?: boolean
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  status: string
  category: string
  stock?: number | null
}

interface ProductAddon {
  id: string
  name: string
  price: number
  isActive: boolean
}

interface AddonSelectionDialogProps {
  open: boolean
  onClose: () => void
  product: Product | null
  addons: ProductAddon[]
  allProducts: Product[]
  onConfirm: (selectedAddons: SaleItemAddon[], secondFlavor?: { productId: string, productName: string, price: number }, comments?: string, otherIngredient?: string) => void
}

function AddonSelectionDialog({ open, onClose, product, addons, allProducts, onConfirm }: AddonSelectionDialogProps) {
  const [selectedAddons, setSelectedAddons] = useState<SaleItemAddon[]>([])
  const [addonQuantities, setAddonQuantities] = useState<{ [key: string]: number }>({})
  const [isTwoFlavors, setIsTwoFlavors] = useState(false)
  const [secondFlavor, setSecondFlavor] = useState<{ productId: string, productName: string, price: number } | null>(null)
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [otherIngredient, setOtherIngredient] = useState('')
  const [comments, setComments] = useState('')

  const handleAddonToggle = (addon: ProductAddon) => {
    const isSelected = selectedAddons.some(selected => selected.addonId === addon.id)
    
    if (isSelected) {
      setSelectedAddons(selectedAddons.filter(selected => selected.addonId !== addon.id))
      setAddonQuantities({ ...addonQuantities, [addon.id]: 0 })
    } else {
      setSelectedAddons([...selectedAddons, {
        addonId: addon.id,
        addonName: addon.name,
        quantity: 1,
        price: Number(addon.price)
      }])
      setAddonQuantities({ ...addonQuantities, [addon.id]: 1 })
    }
  }

  const handleQuantityChange = (addonId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedAddons(selectedAddons.filter(selected => selected.addonId !== addonId))
      setAddonQuantities({ ...addonQuantities, [addonId]: 0 })
    } else {
      setSelectedAddons(selectedAddons.map(selected => 
        selected.addonId === addonId 
          ? { ...selected, quantity }
          : selected
      ))
      setAddonQuantities({ ...addonQuantities, [addonId]: quantity })
    }
  }

  const handleOtherToggle = () => {
    if (isOtherSelected) {
      setOtherIngredient('')
    }
    setIsOtherSelected(!isOtherSelected)
  }

  const handleConfirm = () => {
    // Crear comentarios separados
    let finalComments = comments
    let otherIngredientText = ''
    
    if (isOtherSelected && otherIngredient.trim()) {
      otherIngredientText = `Otro: ${otherIngredient.trim()} +3.000`
    }
    
    onConfirm(selectedAddons, secondFlavor || undefined, finalComments, otherIngredientText)
    setSelectedAddons([])
    setAddonQuantities({})
    setIsTwoFlavors(false)
    setSecondFlavor(null)
    setIsOtherSelected(false)
    setOtherIngredient('')
    setComments('')
  }

  const handleClose = () => {
    setSelectedAddons([])
    setAddonQuantities({})
    setIsTwoFlavors(false)
    setSecondFlavor(null)
    setIsOtherSelected(false)
    setOtherIngredient('')
    setComments('')
    onClose()
  }

  if (!product) return null

  const basePrice = Number(product.price)
  const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
  const otherAddonPrice = isOtherSelected ? 3000 : 0
  
  // Para dos sabores, tomar el precio más alto
  let finalBasePrice = basePrice
  if (isTwoFlavors && secondFlavor) {
    finalBasePrice = Math.max(basePrice, secondFlavor.price)
  }
  
  const totalPrice = finalBasePrice + addonTotal + otherAddonPrice

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Agregar {product.name}
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Producto: {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {product.description}
          </Typography>
          <Typography variant="h6" color="primary">
            Precio base: {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(basePrice)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Agregados disponibles:
        </Typography>

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
          {addons.map((addon) => {
            const isSelected = selectedAddons.some(selected => selected.addonId === addon.id)
            const quantity = addonQuantities[addon.id] || 0

            return (
              <Box key={addon.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isSelected}
                        onChange={() => handleAddonToggle(addon)}
                        size="small"
                      />
                    }
                    label={addon.name}
                    sx={{ margin: 0 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    ({new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(Number(addon.price))})
                  </Typography>
                </Box>
                
                {isSelected && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Button
                      size="small"
                      onClick={() => handleQuantityChange(addon.id, Math.max(0, quantity - 1))}
                      disabled={quantity <= 0}
                      sx={{ minWidth: '24px', height: '24px', fontSize: '12px' }}
                    >
                      -
                    </Button>
                    <Typography variant="caption" minWidth="16px" textAlign="center">
                      {quantity}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleQuantityChange(addon.id, quantity + 1)}
                      sx={{ minWidth: '24px', height: '24px', fontSize: '12px' }}
                    >
                      +
                    </Button>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>

        {/* Agregado "Otro" */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={isOtherSelected}
                  onChange={handleOtherToggle}
                />
              }
              label="Otro"
            />
            <Typography variant="body2" color="text.secondary">
              (Gs. 3.000)
            </Typography>
          </Box>
        </Box>

        {isOtherSelected && (
          <Box mb={2}>
            <TextField
              fullWidth
              size="small"
              label="Especificar ingrediente"
              value={otherIngredient}
              onChange={(e) => setOtherIngredient(e.target.value)}
              placeholder="Ej: Aceitunas, Champiñones, etc."
            />
          </Box>
        )}

        {/* Campo de comentarios */}
        <Box mb={2}>
          <TextField
            fullWidth
            size="small"
            label="Comentarios adicionales"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Ej: Sin cheddar, Bien cocida, etc."
            multiline
            rows={2}
          />
        </Box>

        {/* Sección de dos sabores - solo para pizzas */}
        {(product.category === 'Pizzas' || product.category === 'Pizzas Borde Relleno') && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Opciones de sabor:
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTwoFlavors}
                    onChange={(e) => {
                      setIsTwoFlavors(e.target.checked)
                      if (!e.target.checked) {
                        setSecondFlavor(null)
                      }
                    }}
                  />
                }
                label="Pizza de dos sabores"
              />
              
              {isTwoFlavors && (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Segundo sabor</InputLabel>
                  <Select
                    value={secondFlavor?.productId || ''}
                    label="Segundo sabor"
                    MenuProps={{
                      anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'right',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'right',
                      },
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 250,
                          minWidth: 200,
                        },
                      },
                    }}
                    onChange={(e) => {
                      const selectedProduct = allProducts.find(p => p.id === e.target.value)
                      if (selectedProduct) {
                        setSecondFlavor({
                          productId: selectedProduct.id,
                          productName: selectedProduct.name,
                          price: Number(selectedProduct.price)
                        })
                      }
                    }}
                  >
                    {allProducts
                      .filter(p => p.category === product.category && p.id !== product.id)
                      .map((pizza) => (
                        <MenuItem key={pizza.id} value={pizza.id}>
                          {pizza.name} - {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(Number(pizza.price))}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            
            {isTwoFlavors && secondFlavor && (
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Sabor 1: {product.name} - {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(basePrice)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sabor 2: {secondFlavor.productName} - {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(secondFlavor.price)}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  Precio final: {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(finalBasePrice)} (precio más alto)
                </Typography>
              </Box>
            )}
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Total: {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(totalPrice)}
          </Typography>
          {(addonTotal > 0 || otherAddonPrice > 0) && (
            <Typography variant="body2" color="text.secondary">
              (incluye {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(addonTotal + otherAddonPrice)} en agregados)
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Agregar al Carrito
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function SalesPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [addons, setAddons] = useState<ProductAddon[]>([])
  const [selectedProductForAddons, setSelectedProductForAddons] = useState<Product | null>(null)
  const [addonDialogOpen, setAddonDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState<ClientData>({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    cedula: '',
    ruc: '',
    requiresInvoice: false,
  })
  const [openClientDialog, setOpenClientDialog] = useState(false)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [nextOrderNumber, setNextOrderNumber] = useState<string>('---')
  const [systemConfig, setSystemConfig] = useState({
    restaurantName: 'Polipizza',
    restaurantAddress: 'Dirección del restaurante',
    restaurantPhone: '+595 21 123 456',
    restaurantRuc: '12345678-9',
    footerMessage: '¡Gracias por su compra!',
  })
  const [invoiceData, setInvoiceData] = useState({
    useClientData: true,
    name: '',
    lastName: '',
    email: '',
    phone: '',
    cedula: '',
    ruc: '',
    requiresInvoice: false,
  })
  const [deliveryCost, setDeliveryCost] = useState<number>(0)
  const [orderType, setOrderType] = useState<string>('PICKUP')

  const { control, handleSubmit, formState: { errors } } = useForm<{
    paymentMethod: string
    orderType: string
    discount: number
  }>()

  useEffect(() => {
    fetchProducts()
    fetchClients()
    fetchNextOrderNumber()
    fetchSystemConfig()
    fetchAddons()
  }, [])

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

  const fetchAddons = async () => {
    try {
      const response = await fetch('/api/product-addons')
      if (response.ok) {
        const addonsData = await response.json()
        setAddons(addonsData)
      }
    } catch (error) {
      console.error('Error al obtener agregados:', error)
    }
  }

  const fetchNextOrderNumber = async () => {
    try {
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = String(today.getFullYear())
      const dateStr = `${day}${month}${year}`
      
      const response = await fetch(`/api/sales/count-today`)
      if (response.ok) {
        const data = await response.json()
        const nextNumber = String(data.count + 1).padStart(3, '0')
        setNextOrderNumber(nextNumber)
      }
    } catch (error) {
      console.error('Error fetching next order number:', error)
    }
  }

  useEffect(() => {
    const generateQR = async () => {
      if (cart.length > 0) {
        try {
          const total = calculateTotal(control._formValues?.discount || 0)
          const qr = await generateQRCodeForTicket(
            `PREVIEW_${Date.now()}`, 
            total, 
            'Pizza System'
          )
          setQrCode(qr)
        } catch (error) {
          console.error('Error generando QR:', error)
        }
      } else {
        setQrCode('')
      }
    }
    generateQR()
  }, [cart, control._formValues?.discount, deliveryCost, orderType])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?status=ACTIVE&limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const addToCart = (product: Product, selectedAddons: SaleItemAddon[] = [], secondFlavor?: { productId: string, productName: string, price: number }, comments?: string, otherIngredient?: string) => {
    // Verificar si hay stock disponible
    if (product.stock !== null && product.stock !== undefined && product.stock <= 0) {
      setError('No hay stock disponible para este producto')
      return
    }

    const otherAddonPrice = otherIngredient ? 3000 : 0
    const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)
    const totalAddonPrice = addonTotal + otherAddonPrice
    
    const existingItem = cart.find(item => 
      item.productId === product.id && 
      JSON.stringify(item.addons || []) === JSON.stringify(selectedAddons) &&
      JSON.stringify(item.secondFlavor || null) === JSON.stringify(secondFlavor || null) &&
      item.comments === comments &&
      item.otherIngredient === otherIngredient
    )
    
    if (existingItem) {
      // Verificar si hay suficiente stock para agregar uno más
      if (product.stock !== null && product.stock !== undefined && existingItem.quantity >= product.stock) {
        setError('No hay suficiente stock disponible')
        return
      }
      
      setCart(cart.map(item =>
        item.productId === product.id && 
        JSON.stringify(item.addons || []) === JSON.stringify(selectedAddons) &&
        JSON.stringify(item.secondFlavor || null) === JSON.stringify(secondFlavor || null) &&
        item.comments === comments &&
        item.otherIngredient === otherIngredient
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * (Number(product.price) + totalAddonPrice),
            }
          : item
      ))
    } else {
      // Para dos sabores, tomar el precio más alto
      let basePrice = Number(product.price)
      if (secondFlavor) {
        basePrice = Math.max(Number(product.price), secondFlavor.price)
      }
      
      const itemPrice = basePrice + totalAddonPrice
      
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: itemPrice,
          subtotal: itemPrice,
          addons: selectedAddons.length > 0 ? selectedAddons : undefined,
          secondFlavor: secondFlavor,
          comments: comments,
          otherIngredient: otherIngredient,
        },
      ])
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleProductClick = (product: Product) => {
    // Solo permitir agregados para Pizzas, Hamburguesas y Lomitos
    const categoriesWithAddons = ['Pizzas', 'Pizzas Borde Relleno', 'Hamburguesas', 'Lomitos']
    
    if (categoriesWithAddons.includes(product.category)) {
      setSelectedProductForAddons(product)
      setAddonDialogOpen(true)
    } else {
      // Para otras categorías, agregar directamente al carrito sin agregados
      addToCart(product)
    }
  }

  const handleAddonSelection = (selectedAddons: SaleItemAddon[], secondFlavor?: { productId: string, productName: string, price: number }, comments?: string, otherIngredient?: string) => {
    if (selectedProductForAddons) {
      addToCart(selectedProductForAddons, selectedAddons, secondFlavor, comments, otherIngredient)
    }
    setAddonDialogOpen(false)
    setSelectedProductForAddons(null)
  }

  const getProductsByCategory = () => {
    const categories: { [key: string]: Product[] } = {}
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    filteredProducts.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = []
      }
      categories[product.category].push(product)
    })
    return categories
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId))
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      ))
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedClient(null)
    setDeliveryCost(0)
    setOrderType('PICKUP')
    setInvoiceData({
      useClientData: true,
      name: '',
      lastName: '',
      email: '',
      phone: '',
      cedula: '',
      ruc: '',
      requiresInvoice: false
    })
    control._reset()
    // Actualizar el próximo número de orden
    fetchNextOrderNumber()
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calculateDiscount = (discountPercent: number) => {
    return (calculateSubtotal() * discountPercent) / 100
  }

  const calculateDeliveryCost = () => {
    return orderType === 'DELIVERY' ? deliveryCost : 0
  }

  const calculateTotal = (discountPercent: number) => {
    return calculateSubtotal() - calculateDiscount(discountPercent) + calculateDeliveryCost()
  }

  const handleCreateClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      })

      if (response.ok) {
        const client = await response.json()
        setSelectedClient(client)
        setOpenClientDialog(false)
        setNewClient({
          name: '',
          lastName: '',
          email: '',
          phone: '',
          cedula: '',
          ruc: '',
          requiresInvoice: false,
        })
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al crear el cliente')
      }
    } catch (error) {
      setError('Error al crear el cliente')
    }
  }

  const onSubmit = async (data: { paymentMethod: string; orderType: string; discount: number }) => {
    if (cart.length === 0) {
      setError('Debe agregar al menos un producto al carrito')
      return
    }

    // Inicializar datos de facturación
    if (selectedClient) {
      setInvoiceData({
        useClientData: true,
        name: selectedClient.name,
        lastName: selectedClient.lastName,
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        cedula: selectedClient.cedula || '',
        ruc: selectedClient.ruc || '',
        requiresInvoice: selectedClient.requiresInvoice || false,
      })
    } else {
      setInvoiceData({
        useClientData: false,
        name: '',
        lastName: '',
        email: '',
        phone: '',
        cedula: '',
        ruc: '',
        requiresInvoice: false,
      })
    }

    setOpenConfirmDialog(true)
  }

  const handleConfirmSale = async () => {
    // Validar que si requiere factura, tenga documento válido
    if (invoiceData.requiresInvoice && !invoiceData.cedula && !invoiceData.ruc) {
      setError('Se requiere factura pero no se ha proporcionado cédula ni RUC válidos')
      return
    }

    // Validar que si requiere factura, tenga nombre y apellido
    if (invoiceData.requiresInvoice && (!invoiceData.name || !invoiceData.lastName)) {
      setError('Se requiere factura pero no se ha proporcionado nombre y apellido completos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const discount = control._formValues?.discount || 0
      const paymentMethod = control._formValues?.paymentMethod || 'CASH'
      const finalOrderType = orderType || 'PICKUP'
      
      const saleData: SaleData = {
        clientId: selectedClient?.id,
        items: cart,
        total: calculateTotal(discount),
        discount: calculateDiscount(discount),
        deliveryCost: calculateDeliveryCost(),
        paymentMethod: paymentMethod as any,
        orderType: finalOrderType as any,
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        const sale = await response.json()
        setSuccess(`Venta registrada exitosamente. Número de pedido: ${sale.orderNumber}`)
        
        // Generar PDF del ticket
        setGeneratingPDF(true)
        try {
          await generateTicketPDFFromElement('ticket-preview', `ticket_${sale.orderNumber}.pdf`)
        } catch (pdfError) {
          console.error('Error generando PDF:', pdfError)
          // No mostramos error al usuario, solo lo logueamos
        } finally {
          setGeneratingPDF(false)
        }
        
        setOpenConfirmDialog(false)
        // Limpiar carrito y actualizar número de orden
        clearCart()
        // Recargar productos para actualizar el stock
        fetchProducts()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al registrar la venta')
      }
    } catch (error) {
      setError('Error al registrar la venta')
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

  return (
    <AppLayout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Sistema de Ventas
        </Typography>

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
          {/* Products Section */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productos Disponibles
                </Typography>
                <Box mb={2}>
                  <TextField
                    fullWidth
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
                  />
                </Box>
                
                {/* Categories */}
                {Object.entries(getProductsByCategory()).map(([category, categoryProducts]) => (
                  <Accordion 
                    key={category}
                    expanded={expandedCategories.has(category)}
                    onChange={() => toggleCategory(category)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <Typography variant="h6">
                        {category} ({categoryProducts.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {categoryProducts.map((product) => (
                          <Grid item xs={12} sm={6} md={4} key={product.id}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                              onClick={() => handleProductClick(product)}
                            >
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {product.name} {product.stock !== null && product.stock !== undefined && `(${product.stock})`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {product.description}
                                </Typography>
                                <Typography variant="h6" color="primary">
                                  {formatCurrency(Number(product.price))}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Cart Section */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Carrito de Compras
                  </Typography>
                  <ShoppingCart />
                </Box>

                {/* Client Selection */}
                <Box mb={2}>
                  <Autocomplete
                    options={clients}
                    getOptionLabel={(option) => `${option.name} ${option.lastName}`}
                    value={selectedClient}
                    onChange={(_, newValue) => setSelectedClient(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cliente"
                        placeholder="Seleccionar cliente"
                      />
                    )}
                  />
                  <Button
                    size="small"
                    onClick={() => setOpenClientDialog(true)}
                    sx={{ mt: 1 }}
                  >
                    <Person sx={{ mr: 1 }} />
                    Nuevo Cliente
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Cart Items */}
                {cart.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center">
                    El carrito está vacío
                  </Typography>
                ) : (
                  <List>
                    {cart.map((item, index) => (
                      <ListItem key={`${item.productId}-${index}`} divider>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                {item.productName}
                              </Typography>
                              {item.secondFlavor && (
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  + {item.secondFlavor.productName}
                                </Typography>
                              )}
                              {item.comments && (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  Nota: {item.comments}
                                </Typography>
                              )}
                              {item.otherIngredient && (
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  {item.otherIngredient}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {formatCurrency(item.price)} c/u
                              </Typography>
                              {item.addons && item.addons.length > 0 && (
                                <Box>
                                  {item.addons.map((addon, addonIndex) => (
                                    <Typography key={addonIndex} variant="caption" color="text.secondary">
                                      + {addon.quantity}x {addon.addonName} ({formatCurrency(addon.price * addon.quantity)})
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Remove />
                            </IconButton>
                            <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Add />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* Cart Summary */}
                {cart.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Subtotal:</Typography>
                        <Typography>{formatCurrency(calculateSubtotal())}</Typography>
                      </Box>
                      
                      <Controller
                        name="discount"
                        control={control}
                        defaultValue={0}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Descuento (%)"
                            type="number"
                            size="small"
                            fullWidth
                            inputProps={{ min: 0, max: 100 }}
                          />
                        )}
                      />
                      
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Descuento:</Typography>
                        <Typography color="error">
                          -{formatCurrency(calculateDiscount(control._formValues?.discount || 0))}
                        </Typography>
                      </Box>
                      
                      {/* Mostrar coste de delivery solo si es delivery */}
                      {orderType === 'DELIVERY' && deliveryCost > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography>Delivery:</Typography>
                          <Typography color="primary">
                            {formatCurrency(deliveryCost)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(calculateTotal(control._formValues?.discount || 0))}
                        </Typography>
                      </Box>
                    </Box>

                    <Controller
                      name="orderType"
                      control={control}
                      rules={{ required: 'El tipo de pedido es requerido' }}
                      render={({ field }) => (
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Tipo de Pedido</InputLabel>
                          <Select
                            {...field}
                            value={orderType}
                            label="Tipo de Pedido"
                            error={!!errors.orderType}
                            onChange={(e) => {
                              const newOrderType = e.target.value
                              setOrderType(newOrderType)
                              field.onChange(e)
                              // Reset delivery cost when changing order type
                              if (newOrderType !== 'DELIVERY') {
                                setDeliveryCost(0)
                              }
                            }}
                          >
                            <MenuItem value="PICKUP">Pasa a buscar/Para llevar</MenuItem>
                            <MenuItem value="DELIVERY">Delivery</MenuItem>
                            <MenuItem value="DINE_IN">Consumo en local</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />

                    {/* Selector de coste de delivery - solo visible cuando el tipo es DELIVERY */}
                    {orderType === 'DELIVERY' && (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Coste de Delivery</InputLabel>
                        <Select
                          value={deliveryCost}
                          label="Coste de Delivery"
                          onChange={(e) => setDeliveryCost(Number(e.target.value))}
                        >
                          {DELIVERY_COST_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <Controller
                      name="paymentMethod"
                      control={control}
                      rules={{ required: 'El método de pago es requerido' }}
                      render={({ field }) => (
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Método de Pago</InputLabel>
                          <Select
                            {...field}
                            label="Método de Pago"
                            error={!!errors.paymentMethod}
                          >
                            <MenuItem value="CASH">Efectivo</MenuItem>
                            <MenuItem value="CARD">Tarjeta</MenuItem>
                            <MenuItem value="TRANSFER">Transferencia</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleSubmit(onSubmit)}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <AttachMoney />}
                    >
                      {loading ? 'Procesando...' : 'Finalizar Venta'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* New Client Dialog */}
        <Dialog open={openClientDialog} onClose={() => setOpenClientDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogContent>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Nombre"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Apellido"
                value={newClient.lastName}
                onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                fullWidth
                required
              />
            </Box>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                fullWidth
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Cédula"
                value={newClient.cedula}
                onChange={(e) => setNewClient({ ...newClient, cedula: e.target.value })}
                fullWidth
              />
              <TextField
                label="RUC"
                value={newClient.ruc}
                onChange={(e) => setNewClient({ ...newClient, ruc: e.target.value })}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenClientDialog(false)}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateClient}
              disabled={!newClient.name || !newClient.lastName}
            >
              Crear Cliente
            </Button>
          </DialogActions>
        </Dialog>

        {/* Addons Dialog */}
        <AddonSelectionDialog
          open={addonDialogOpen}
          onClose={() => {
            setAddonDialogOpen(false)
            setSelectedProductForAddons(null)
          }}
          product={selectedProductForAddons}
          addons={addons}
          allProducts={products}
          onConfirm={handleAddonSelection}
        />

        {/* Sale Confirmation Dialog */}
        <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <ShoppingCart />
              Confirmar Venta
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Resumen de Pago */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💰 Resumen de Pago
                    </Typography>
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Subtotal:</Typography>
                        <Typography>{formatCurrency(calculateSubtotal())}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Descuento ({(control._formValues?.discount || 0)}%):</Typography>
                        <Typography color="error">
                          -{formatCurrency(calculateDiscount(control._formValues?.discount || 0))}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6">Total a Pagar:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(calculateTotal(control._formValues?.discount || 0))}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tipo de pedido: {control._formValues?.orderType === 'PICKUP' ? 'Pasar a buscar' : 
                                        control._formValues?.orderType === 'DELIVERY' ? 'Delivery' : 'Consumo en local'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Método de pago: {control._formValues?.paymentMethod === 'CASH' ? 'Efectivo' : 
                                        control._formValues?.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Datos de Facturación */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        🧾 Datos de Facturación
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={invoiceData.useClientData}
                            onChange={(e) => setInvoiceData({
                              ...invoiceData,
                              useClientData: e.target.checked,
                              ...(e.target.checked && selectedClient ? {
                                name: selectedClient.name,
                                lastName: selectedClient.lastName,
                                email: selectedClient.email || '',
                                phone: selectedClient.phone || '',
                                cedula: selectedClient.cedula || '',
                                ruc: selectedClient.ruc || '',
                                requiresInvoice: selectedClient.requiresInvoice,
                              } : {})
                            })}
                          />
                        }
                        label="Usar datos del cliente"
                        labelPlacement="start"
                      />
                    </Box>

                    {invoiceData.useClientData && selectedClient ? (
                      <Box>
                        <Typography variant="body1" gutterBottom>
                          <strong>Cliente:</strong> {selectedClient.name} {selectedClient.lastName}
                        </Typography>
                        {selectedClient.email && (
                          <Typography variant="body2" color="text.secondary">
                            Email: {selectedClient.email}
                          </Typography>
                        )}
                        {selectedClient.phone && (
                          <Typography variant="body2" color="text.secondary">
                            Teléfono: {selectedClient.phone}
                          </Typography>
                        )}
                        {selectedClient.cedula && (
                          <Typography variant="body2" color="text.secondary">
                            Cédula: {selectedClient.cedula}
                          </Typography>
                        )}
                        {selectedClient.ruc && (
                          <Typography variant="body2" color="text.secondary">
                            RUC: {selectedClient.ruc}
                          </Typography>
                        )}
                        <Box mt={2}>
                          <Chip
                            label={selectedClient.requiresInvoice ? 'Requiere Factura' : 'No requiere Factura'}
                            color={selectedClient.requiresInvoice ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {selectedClient ? 'Datos personalizados para facturación' : 'Venta sin cliente registrado'}
                        </Typography>
                        
                        <Box display="flex" gap={2} mb={2}>
                          <TextField
                            label="Nombre"
                            value={invoiceData.name}
                            onChange={(e) => setInvoiceData({ ...invoiceData, name: e.target.value })}
                            fullWidth
                            size="small"
                          />
                          <TextField
                            label="Apellido"
                            value={invoiceData.lastName}
                            onChange={(e) => setInvoiceData({ ...invoiceData, lastName: e.target.value })}
                            fullWidth
                            size="small"
                          />
                        </Box>

                        <Box display="flex" gap={2} mb={2}>
                          <TextField
                            label="Email"
                            type="email"
                            value={invoiceData.email}
                            onChange={(e) => setInvoiceData({ ...invoiceData, email: e.target.value })}
                            fullWidth
                            size="small"
                          />
                          <TextField
                            label="Teléfono"
                            value={invoiceData.phone}
                            onChange={(e) => setInvoiceData({ ...invoiceData, phone: e.target.value })}
                            fullWidth
                            size="small"
                          />
                        </Box>

                        <Box display="flex" gap={2} mb={2}>
                          <TextField
                            label="Cédula"
                            value={invoiceData.cedula}
                            onChange={(e) => setInvoiceData({ ...invoiceData, cedula: e.target.value })}
                            fullWidth
                            size="small"
                          />
                          <TextField
                            label="RUC"
                            value={invoiceData.ruc}
                            onChange={(e) => setInvoiceData({ ...invoiceData, ruc: e.target.value })}
                            fullWidth
                            size="small"
                          />
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={invoiceData.requiresInvoice}
                                onChange={(e) => setInvoiceData({ ...invoiceData, requiresInvoice: e.target.checked })}
                              />
                            }
                            label="Requiere factura"
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setInvoiceData({
                              ...invoiceData,
                              name: '',
                              lastName: '',
                              email: '',
                              phone: '',
                              cedula: '',
                              ruc: '',
                              requiresInvoice: false,
                            })}
                          >
                            Limpiar
                          </Button>
                        </Box>

                        {invoiceData.requiresInvoice && (
                          <Box mt={1}>
                            <Alert severity="info" sx={{ fontSize: '12px' }}>
                              {invoiceData.cedula && invoiceData.ruc ? (
                                <Typography variant="body2">
                                  ⚠️ Se ha proporcionado tanto cédula como RUC. 
                                  Se usará {invoiceData.ruc} para la factura.
                                </Typography>
                              ) : invoiceData.cedula ? (
                                <Typography variant="body2">
                                  📋 Factura se emitirá con cédula: {invoiceData.cedula}
                                </Typography>
                              ) : invoiceData.ruc ? (
                                <Typography variant="body2">
                                  📋 Factura se emitirá con RUC: {invoiceData.ruc}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="error">
                                  ❌ Se requiere factura pero no se ha proporcionado documento válido
                                </Typography>
                              )}
                            </Alert>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Vista Previa del Ticket */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        🖨️ Vista Previa del Ticket
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Print />}
                        onClick={() => generateTicketPDFFromElement('ticket-preview', `ticket_preview_${new Date().toISOString().split('T')[0]}.pdf`)}
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
                          <Typography variant="body2" sx={{ fontSize: '20px' }}>
                            Pedido: {(() => {
                              const dateStr = generateOrderNumber()
                              return (
                                <>
                                  {dateStr}-<span style={{ fontSize: '24px', fontWeight: 'bold' }}>{nextOrderNumber}</span>
                                </>
                              )
                            })()}
                          </Typography>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Fecha: {getParaguayDate().toLocaleString('es-PY', { timeZone: 'America/Asuncion', hour12: false })}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Cajero: {user ? `${user.name} ${user.lastName}` : 'Usuario Actual'}
                        </Typography>
                        {(invoiceData.useClientData && selectedClient) || (!invoiceData.useClientData && invoiceData.name) ? (
                          <>
                            <Typography variant="body2" sx={{ fontSize: '20px' }}>
                              Cliente: {invoiceData.useClientData ? 
                                `${selectedClient?.name} ${selectedClient?.lastName}` : 
                                `${invoiceData.name} ${invoiceData.lastName}`
                              }
                            </Typography>
                            {((invoiceData.useClientData && (selectedClient?.cedula || selectedClient?.ruc)) || 
                              (!invoiceData.useClientData && (invoiceData.cedula || invoiceData.ruc))) && (
                               <Typography variant="body2" sx={{ fontSize: '20px' }}>
                                 Doc. Num.: {invoiceData.useClientData ? 
                                   (selectedClient?.cedula || selectedClient?.ruc) : 
                                   (invoiceData.cedula || invoiceData.ruc)
                                 }
                               </Typography>
                            )}
                          </>
                        ) : null}
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '20px', fontWeight: 'bold' }}>
                          PRODUCTOS:
                        </Typography>
                        {cart.map((item, index) => (
                          <Box key={index}>
                            <Typography variant="body2" sx={{ fontSize: '20px' }}>
                              {item.productName}
                              {item.secondFlavor && (
                                <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                                  {' '}+ {item.secondFlavor.productName}
                                </span>
                              )}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '20px' }}>
                              &nbsp;&nbsp;{item.quantity} x {formatCurrency(item.price)} = {formatCurrency(item.subtotal)}
                            </Typography>
                            {item.comments && (
                              <Typography variant="body2" sx={{ fontSize: '18px', fontStyle: 'italic', color: '#666' }}>
                                &nbsp;&nbsp;Nota: {item.comments}
                              </Typography>
                            )}
                            {item.otherIngredient && (
                              <Typography variant="body2" sx={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                                &nbsp;&nbsp;{item.otherIngredient}
                              </Typography>
                            )}
                            {item.addons && item.addons.length > 0 && (
                              <Box sx={{ ml: 2 }}>
                                {item.addons.map((addon, addonIndex) => (
                                  <Typography key={addonIndex} variant="body2" sx={{ fontSize: '18px' }}>
                                    &nbsp;&nbsp;+ {addon.quantity}x {addon.addonName} = {formatCurrency(addon.price * addon.quantity)}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Subtotal: {formatCurrency(calculateSubtotal())}
                        </Typography>
                        {(control._formValues?.discount || 0) > 0 && (
                          <Typography variant="body2" sx={{ fontSize: '20px' }}>
                            Descuento: -{formatCurrency(calculateDiscount(control._formValues?.discount || 0))}
                          </Typography>
                        )}
                        {orderType === 'DELIVERY' && deliveryCost > 0 && (
                          <Typography variant="body2" sx={{ fontSize: '20px' }}>
                            Delivery: {formatCurrency(deliveryCost)}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ fontSize: '28px', fontWeight: 'bold' }}>
                          TOTAL: {formatCurrency(calculateTotal(control._formValues?.discount || 0))}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Tipo de pedido: {orderType === 'PICKUP' ? 'Pasa a buscar/Para llevar' : 
                                          orderType === 'DELIVERY' ? 'Delivery' : 'Consumo en local'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '20px' }}>
                          Método de pago: {control._formValues?.paymentMethod === 'CASH' ? 'Efectivo' : 
                                          control._formValues?.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box textAlign="center">
                        {systemConfig.footerMessage && (
                          <Typography variant="body2" sx={{ fontSize: '20px', mt: 1 }}>
                            {systemConfig.footerMessage}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ fontSize: '18px', color: '#666', mt: 1, fontWeight: 'bold' }}>
                          BitcanPOS - bitcan.com.py
                        </Typography>
                      </Box>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSale}
              disabled={
                loading || generatingPDF ||
                (invoiceData.requiresInvoice && !invoiceData.cedula && !invoiceData.ruc) ||
                (invoiceData.requiresInvoice && (!invoiceData.name || !invoiceData.lastName))
              }
              startIcon={
                loading ? <CircularProgress size={20} /> : 
                generatingPDF ? <Print /> : <AttachMoney />
              }
            >
              {loading ? 'Procesando...' : 
               generatingPDF ? 'Generando PDF...' : 'Confirmar Venta'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  )
}
