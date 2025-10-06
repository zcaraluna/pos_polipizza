import { User, UserRole, PaymentMethod, TransactionType, ProductStatus, OrderType } from '@prisma/client'

export type { User, UserRole, PaymentMethod, TransactionType, ProductStatus, OrderType }

export interface AuthUser {
  id: string
  name: string
  lastName: string
  username: string
  email: string
  role: UserRole
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  name: string
  lastName: string
  cedula: string
  phone: string
  email: string
  address: string
  username: string
  password: string
  role: UserRole
}

export interface ClientData {
  name: string
  lastName: string
  email?: string
  phone?: string
  cedula?: string
  ruc?: string
  requiresInvoice: boolean
}

export interface ProductData {
  name: string
  description?: string
  price: number
  category: string
  status: ProductStatus
  stock?: number | null
}

export interface IngredientData {
  name: string
  description?: string
  unit: string
  minStock: number
  currentStock: number
  cost: number
}

export interface SaleItemAddon {
  addonId: string
  addonName: string
  quantity: number
  price: number
}

export interface SaleItem {
  productId: string
  quantity: number
  price: number
  subtotal: number
  addons?: SaleItemAddon[]
  secondFlavor?: {
    productId: string
    productName: string
    price: number
  }
  comments?: string
  otherIngredient?: string
}

export interface SaleData {
  clientId?: string
  items: SaleItem[]
  total: number
  discount: number
  deliveryCost?: number
  paymentMethod: PaymentMethod
  orderType: OrderType
}

export interface CashMovementData {
  type: TransactionType
  amount: number
  description?: string
  saleId?: string
}

export interface DashboardStats {
  totalSalesToday: number
  newClientsToday: number
  cashRegisterStatus: {
    isOpen: boolean
    currentBalance: number
  }
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  lowStockAlerts: Array<{
    name: string
    currentStock: number
    minStock: number
  }>
}

export interface ReportFilters {
  startDate?: Date
  endDate?: Date
  userId?: string
  clientId?: string
  productId?: string
}

export interface SalesReport {
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

export interface InventoryReport {
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

export interface CashReport {
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

export interface SystemConfig {
  id?: string
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
  createdAt?: Date
  updatedAt?: Date
}

export interface PrinterConfig {
  ip: string
  port: number
  paperWidth: number
}

export interface TicketData {
  orderNumber: string
  clientName?: string
  clientCedula?: string
  cashierName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
    secondFlavor?: {
      productName: string
    }
    comments?: string
    otherIngredient?: string
  }>
  subtotal: number
  discount: number
  deliveryCost?: number
  total: number
  paymentMethod: string
  orderType: string
  date: string
  qrCode?: string
  restaurantName: string
  restaurantAddress: string
  restaurantPhone: string
  restaurantRuc: string
  footerMessage?: string
}
