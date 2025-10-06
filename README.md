# 🍕 Sistema de Gestión para Pizzería

Sistema completo de administración para pizzería desarrollado con Next.js, TypeScript, PostgreSQL y Material-UI.

## 🚀 Características

### 🔐 Autenticación y Usuarios
- Sistema de login con usuario y contraseña
- Tres niveles de usuario: SYSADMIN, ADMIN, USER
- Contraseñas encriptadas con bcrypt
- Sesiones JWT seguras
- Auditoría de accesos

### 🏠 Dashboard
- Resumen de ventas del día
- Cantidad de clientes nuevos
- Estado de caja (abierta/cerrada, saldo actual)
- Productos más vendidos
- Alertas de inventario bajo

### 👥 Gestión de Clientes
- Base de datos completa de clientes
- Búsqueda avanzada
- Indicador de facturación requerida
- Validación de documentos únicos

### 📦 Inventario
- Administración de materia prima
- Registro de entradas y salidas
- Alertas de stock mínimo
- Asociación con productos
- Historial de movimientos

### 🍕 Catálogo de Productos
- Gestión completa de productos
- Precios en guaraníes paraguayos (PYG)
- Estados activo/inactivo
- Asociación con ingredientes

### 🛒 Sistema de Ventas
- Carrito de compras interactivo
- Selección de cliente (nuevo o existente)
- Cálculo automático de totales
- Aplicación de descuentos
- Múltiples métodos de pago

### 💵 Gestión de Caja
- Apertura y cierre de caja
- Control de saldo actual
- Extracciones con motivo
- Historial de movimientos
- Solo ADMIN y SYSADMIN pueden operar

### 🖨️ Impresión Térmica
- Compatible con impresoras ZKTeco ZKP5803 (58mm)
- Tickets con formato profesional
- Código QR de verificación
- Datos completos del pedido

## 🛠️ Stack Tecnológico

- **Frontend/Backend**: Next.js 14 con TypeScript
- **UI**: Material-UI (MUI) v5
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT con cookies httpOnly
- **Encriptación**: bcrypt
- **Impresión**: escpos-usb para impresoras térmicas
- **QR**: qrcode para códigos de verificación

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 13+
- Impresora térmica ZKTeco ZKP5803 (opcional)

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd pizza-management-system
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/pizza_sys"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# App Configuration
APP_NAME="Pizza Management System"
APP_VERSION="1.0.0"

# Printer Configuration
PRINTER_IP="192.168.1.100"
PRINTER_PORT=9100
```

### 4. Configurar base de datos
```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar migraciones
npm run db:push

# Poblar con datos iniciales
npm run db:seed
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Usuarios de Prueba

El sistema viene con usuarios preconfigurados:

| Usuario | Contraseña | Rol | Permisos |
|---------|------------|-----|----------|
| admin | admin123 | SYSADMIN | Control total, configuración, caja, usuarios |
| manager | admin123 | ADMIN | Gestión de ventas, caja, inventario, reportes |
| cajero | admin123 | USER | Solo ventas y consultas básicas |

## 📱 Uso del Sistema

### 1. Iniciar Sesión
- Acceder a `http://localhost:3000/login`
- Usar las credenciales de prueba

### 2. Dashboard
- Vista general del estado del negocio
- Estadísticas en tiempo real
- Alertas importantes

### 3. Gestión de Clientes
- Agregar nuevos clientes
- Buscar clientes existentes
- Editar información
- Marcar si requieren factura

### 4. Inventario
- Registrar ingredientes
- Controlar stock mínimo
- Registrar entradas y salidas
- Ver alertas de stock bajo

### 5. Productos
- Crear catálogo de productos
- Asociar con ingredientes
- Gestionar precios
- Controlar estados

### 6. Ventas
- Seleccionar productos del catálogo
- Agregar al carrito
- Seleccionar cliente
- Aplicar descuentos
- Procesar pago

### 7. Caja
- Abrir caja con monto inicial
- Realizar extracciones
- Cerrar caja con monto final
- Ver historial de movimientos

## 🖨️ Configuración de Impresora

### 1. Conectar Impresora
- Conectar impresora ZKTeco ZKP5803 a la red
- Configurar IP estática (ej: 192.168.1.100)
- Verificar puerto 9100 abierto

### 2. Configurar en el Sistema
- Actualizar `PRINTER_IP` en `.env.local`
- Probar conexión desde el panel de administración

### 3. Formato de Tickets
Los tickets incluyen:
- Datos de la pizzería
- Número de pedido
- Información del cliente
- Lista de productos
- Totales y descuentos
- Código QR de verificación

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar en producción
npm run lint         # Verificar código

# Base de datos
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar cambios al esquema
npm run db:migrate   # Crear migración
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Poblar con datos iniciales
```

## 📊 Estructura de la Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `clients` - Clientes de la pizzería
- `products` - Catálogo de productos
- `ingredients` - Materia prima
- `product_ingredients` - Relación productos-ingredientes
- `inventory_movements` - Movimientos de inventario
- `sales` - Ventas realizadas
- `sale_items` - Items de cada venta
- `cash_register` - Estado de la caja
- `cash_movements` - Movimientos de caja
- `audit_logs` - Logs de auditoría
- `system_config` - Configuración del sistema

## 🔒 Seguridad

- Contraseñas encriptadas con bcrypt
- Sesiones JWT con cookies httpOnly
- Middleware de autenticación
- Control de roles y permisos
- Auditoría de acciones críticas
- Validación de datos en frontend y backend

## 🚀 Despliegue en Producción

### 1. Variables de Entorno
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="secure-random-string-256-bits"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="secure-nextauth-secret"
```

### 2. Base de Datos
- Configurar PostgreSQL en servidor
- Aplicar migraciones: `npm run db:push`
- Poblar datos iniciales: `npm run db:seed`

### 3. Construcción
```bash
npm run build
npm run start
```

### 4. Configuración de Impresora
- Configurar IP estática de la impresora
- Actualizar variables de entorno
- Probar conectividad

## 📈 Reportes y Estadísticas

El sistema incluye reportes de:
- Ventas por período
- Productos más vendidos
- Rendimiento por empleado
- Movimientos de caja
- Estado de inventario

## 🆘 Solución de Problemas

### Error de Conexión a Base de Datos
- Verificar que PostgreSQL esté ejecutándose
- Confirmar credenciales en `DATABASE_URL`
- Verificar que la base de datos `pizza_sys` exista

### Error de Impresora
- Verificar conectividad de red
- Confirmar IP y puerto en configuración
- Probar con comando de test

### Error de Autenticación
- Verificar `JWT_SECRET` en variables de entorno
- Limpiar cookies del navegador
- Verificar que el usuario exista en la base de datos

## 📞 Soporte

Para soporte técnico o consultas:
- Revisar logs en la consola del navegador
- Verificar logs del servidor
- Consultar documentación de Prisma y Next.js

## 📄 Licencia

Este proyecto está desarrollado para uso comercial de pizzerías.

---

**¡Disfruta gestionando tu pizzería con este sistema completo y profesional! 🍕**


