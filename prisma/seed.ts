import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create system admin user
  const sysadminPassword = await bcrypt.hash('admin123', 12)
  
  const sysadmin = await prisma.user.create({
    data: {
      name: 'Garv',
      lastName: 'SysAdmin',
      cedula: '1234567890',
      phone: '+595981234567',
      email: 'garv@pizzeria.com',
      address: 'Asunción, Paraguay',
      username: 'garv',
      password: sysadminPassword,
      role: 'SYSADMIN',
    },
  })

  // Create sample ingredients
  const ingredients = await Promise.all([
    prisma.ingredient.create({
      data: {
        name: 'Masa para Pizza',
        description: 'Masa base para pizzas',
        unit: 'kg',
        minStock: 5.0,
        currentStock: 20.0,
        cost: 2500.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Salsa de Tomate',
        description: 'Salsa base para pizzas',
        unit: 'litros',
        minStock: 2.0,
        currentStock: 10.0,
        cost: 8000.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Queso Mozzarella',
        description: 'Queso para pizzas',
        unit: 'kg',
        minStock: 3.0,
        currentStock: 15.0,
        cost: 12000.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Pepperoni',
        description: 'Salchicha italiana',
        unit: 'kg',
        minStock: 2.0,
        currentStock: 8.0,
        cost: 15000.0,
      },
    }),
    prisma.ingredient.create({
      data: {
        name: 'Champiñones',
        description: 'Hongos frescos',
        unit: 'kg',
        minStock: 1.0,
        currentStock: 5.0,
        cost: 10000.0,
      },
    }),
  ])

  // Create complete menu products
  const products = await Promise.all([
    // MENÚ PIZZAS (8 porciones, borde normal)
    prisma.product.create({
      data: {
        name: 'Pizza Margarita',
        description: 'Queso mozzarella, salsa de tomate natural, tomate en rodajas, albahaca y aceituna.',
        price: 35000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Muza Tradicional',
        description: 'Queso mozzarella, salsa de tomate natural, aceituna y orégano.',
        price: 30000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Peperoni',
        description: 'Queso mozzarella, salsa de tomate, pepperoni y orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jamón',
        description: 'Queso mozzarella, salsa de tomate, jamón en trozos, aceituna y orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mexicana',
        description: 'Queso mozzarella, salsa de tomate, trozos de carne de lomito, cebolla salteada, tiras de morrones, aceituna, orégano y extra picante.',
        price: 45000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: '4 Quesos',
        description: 'Queso mozzarella, queso catupiri, queso sardo, queso roquefort, salsa de tomate, aceituna y orégano.',
        price: 45000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Doble Muzzarella',
        description: 'Queso mozzarella doble, salsa de tomate, aceituna y orégano.',
        price: 35000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Choclo',
        description: 'Queso mozzarella, salsa de tomate, choclo, aceituna y orégano.',
        price: 35000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pizza Burguer',
        description: 'Queso mozzarella, carne hamburguesa, queso cheddar, salsa de ajo y orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pollo Catupiri',
        description: 'Queso mozzarella, queso catupiri, salsa de tomate, pollo, aceituna, orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Catupiri',
        description: 'Queso mozzarella, queso catupiri, salsa de tomate, aceituna, orégano.',
        price: 35000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Primavera',
        description: 'Queso mozzarella, salsa de tomate, jamón en trozos, morrones, tomate en trozos, aceituna y orégano.',
        price: 35000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Napolitana',
        description: 'Queso mozzarella, salsa de tomate, tomate en rodajas, jamón en trocitos, aceituna y orégano.',
        price: 35000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Panceta',
        description: 'Queso mozzarella, salsa de tomate, panceta, aceituna y orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Palmito',
        description: 'Queso mozzarella, salsa de tomate, palmito, aceituna y orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Champiñón',
        description: 'Queso mozzarella, salsa de tomate, champiñón, aceituna y orégano.',
        price: 40000.0,
        category: 'Pizzas',
      },
    }),
    
    // MENÚ PIZZAS (8 porciones, borde relleno)
    prisma.product.create({
      data: {
        name: 'Pizza Margarita (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate natural, tomate en rodajas, albahaca y aceituna.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Muza Tradicional (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate natural, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Peperoni (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, pepperoni y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jamón (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, jamón en trozos, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mexicana (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, trozos de carne de lomito, cebolla salteada, tiras de morrones, aceituna, orégano y extra picante.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: '4 Quesos (Borde Relleno)',
        description: 'Queso mozzarella, queso catupiri, queso sardo, queso roquefort, salsa de tomate, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Doble Muzzarella (Borde Relleno)',
        description: 'Queso mozzarella doble, salsa de tomate, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Choclo (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, choclo, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pizza Burguer (Borde Relleno)',
        description: 'Queso mozzarella, carne hamburguesa, queso cheddar, salsa de ajo y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pollo Catupiri (Borde Relleno)',
        description: 'Queso mozzarella, queso catupiri, salsa de tomate, pollo, aceituna, orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Catupiri (Borde Relleno)',
        description: 'Queso mozzarella, queso catupiri, salsa de tomate, aceituna, orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Primavera (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, jamón en trozos, morrones, tomate en trozos, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Napolitana (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, tomate en rodajas, jamón en trocitos, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Panceta (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, panceta, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Palmito (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, palmito, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Champiñón (Borde Relleno)',
        description: 'Queso mozzarella, salsa de tomate, champiñón, aceituna y orégano.',
        price: 60000.0,
        category: 'Pizzas Borde Relleno',
      },
    }),
    
    // MENÚ HAMBURGUESAS
    prisma.product.create({
      data: {
        name: 'Hamburguesa XL Completa',
        description: 'Pan, carne XL, huevo, lechuga, tomate, queso cheddar.',
        price: 17000.0,
        category: 'Hamburguesas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hamburguesa XL Simple',
        description: 'Pan, carne XL, huevo.',
        price: 14000.0,
        category: 'Hamburguesas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hamburguesa Doble Simple',
        description: 'Pan, doble carne XL, doble queso cheddar.',
        price: 20000.0,
        category: 'Hamburguesas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hamburguesa Doble Completa',
        description: 'Pan, doble carne XL, huevo, lechuga, tomate, doble queso cheddar.',
        price: 25000.0,
        category: 'Hamburguesas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hamburguesa XL Carne, Cheddar',
        description: 'Pan, doble carne, queso cheddar.',
        price: 12000.0,
        category: 'Hamburguesas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hamburguesa Kids',
        description: 'Pan, doble carne, queso cheddar.',
        price: 8000.0,
        category: 'Hamburguesas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Desmechado de Vacío',
        description: '',
        price: 25000.0,
        category: 'Hamburguesas',
      },
    }),
    
    // LOMITOS
    prisma.product.create({
      data: {
        name: 'Sándwich de Lomito',
        description: 'Pan, carne, huevo, lechuga, tomate, queso cheddar.',
        price: 22000.0,
        category: 'Lomitos',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sándwich de Lomito Doble',
        description: 'Pan, doble carne, huevo, lechuga, tomate, queso cheddar.',
        price: 30000.0,
        category: 'Lomitos',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lomito Árabe Mixto',
        description: '',
        price: 22000.0,
        category: 'Lomitos',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lomito Árabe de Carne',
        description: '',
        price: 28000.0,
        category: 'Lomitos',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lomito Árabe de Pollo',
        description: '',
        price: 28000.0,
        category: 'Lomitos',
      },
    }),
    
    // PAPAS
    prisma.product.create({
      data: {
        name: 'Papas Fritas Grande',
        description: '',
        price: 15000.0,
        category: 'Papas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Papas Fritas Pequeño',
        description: '',
        price: 10000.0,
        category: 'Papas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Papas Fritas Especial',
        description: 'Papas, panceta, cebollita y queso cheddar.',
        price: 25000.0,
        category: 'Papas',
      },
    }),
    
    // BEBIDAS SIN ALCOHOL
    prisma.product.create({
      data: {
        name: 'Coca Cola 500ml',
        description: '',
        price: 7000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coca Cola 1lts',
        description: '',
        price: 10000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coca Cola 1,5 lts',
        description: '',
        price: 13000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coca Cola 2 lts',
        description: '',
        price: 16000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coca Cola Personal',
        description: '',
        price: 5000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jugo Del Valle Cartón 1lts',
        description: '',
        price: 12000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jugo Del Valle Chico',
        description: '',
        price: 5000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jugo Del Valle Botella',
        description: '',
        price: 12000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Power',
        description: '',
        price: 10000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Agua Tónica 500ml',
        description: '',
        price: 7000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Agua 500ml',
        description: '',
        price: 5000.0,
        category: 'Bebidas sin alcohol',
      },
    }),
    
    // CERVEZAS
    prisma.product.create({
      data: {
        name: 'Skol Botellita',
        description: '',
        price: 7000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Corona',
        description: '',
        price: 18000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ouro Tubito',
        description: '',
        price: 15000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bud 66 Botella',
        description: '',
        price: 15000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coronita',
        description: '',
        price: 7500.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Skol Lata',
        description: '',
        price: 6000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Munich Ultra Lata',
        description: '',
        price: 4000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bud 66 Lata 310',
        description: '',
        price: 6000.0,
        category: 'Cervezas',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Miller Botella',
        description: '',
        price: 15000.0,
        category: 'Cervezas',
      },
    }),
    
    // CÓCTELES
    prisma.product.create({
      data: {
        name: 'Daiquiri',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fresa',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Durazno',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mburukuja',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sangría',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gin',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fernet',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caipiriña',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Aperol',
        description: '',
        price: 20000.0,
        category: 'Cócteles',
      },
    }),
  ])

  // Create product addons
  const addons = await Promise.all([
    prisma.productAddon.create({
      data: {
        name: 'Jamón',
        price: 3000.0,
      },
    }),
    prisma.productAddon.create({
      data: {
        name: 'Panceta',
        price: 3000.0,
      },
    }),
    prisma.productAddon.create({
      data: {
        name: 'Repollo',
        price: 2000.0,
      },
    }),
    prisma.productAddon.create({
      data: {
        name: 'Salsas',
        price: 2000.0,
      },
    }),
    prisma.productAddon.create({
      data: {
        name: 'Kétchup',
        price: 2000.0,
      },
    }),
  ])

  // TODO: Create product-ingredient relationships later
  // const masa = ingredients.find(i => i.name === 'Masa para Pizza')!
  // const salsa = ingredients.find(i => i.name === 'Salsa de Tomate')!
  // const queso = ingredients.find(i => i.name === 'Queso Mozzarella')!
  // const pepperoni = ingredients.find(i => i.name === 'Pepperoni')!

  // const pizzaMargherita = products.find(p => p.name === 'Pizza Margherita')!
  // const pizzaPepperoni = products.find(p => p.name === 'Pizza Pepperoni')!

  // await Promise.all([
  //   // Pizza Margherita ingredients
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaMargherita.id,
  //       ingredientId: masa.id,
  //       quantity: 0.3, // 300g de masa
  //     },
  //   }),
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaMargherita.id,
  //       ingredientId: salsa.id,
  //       quantity: 0.1, // 100ml de salsa
  //     },
  //   }),
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaMargherita.id,
  //       ingredientId: queso.id,
  //       quantity: 0.15, // 150g de queso
  //     },
  //   }),
  //   // Pizza Pepperoni ingredients
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaPepperoni.id,
  //       ingredientId: masa.id,
  //       quantity: 0.3, // 300g de masa
  //     },
  //   }),
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaPepperoni.id,
  //       ingredientId: salsa.id,
  //       quantity: 0.1, // 100ml de salsa
  //     },
  //   }),
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaPepperoni.id,
  //       ingredientId: queso.id,
  //       quantity: 0.15, // 150g de queso
  //     },
  //   }),
  //   prisma.productIngredient.create({
  //     data: {
  //       productId: pizzaPepperoni.id,
  //       ingredientId: pepperoni.id,
  //       quantity: 0.08, // 80g de pepperoni
  //     },
  //   }),
  // ])

  // Create sample clients
  await Promise.all([
    prisma.client.create({
      data: {
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+595981111111',
        cedula: '123456789',
        requiresInvoice: false,
      },
    }),
    prisma.client.create({
      data: {
        name: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@email.com',
        phone: '+595982222222',
        cedula: '987654321',
        requiresInvoice: true,
      },
    }),
  ])

  // Create cash register
  await prisma.cashRegister.create({
    data: {
      id: 'default-cash-register',
      isOpen: false,
      currentBalance: 0.0,
    },
  })

  // Create system configuration
  await prisma.systemConfig.create({
      data: {
      restaurantName: 'Pizzería del Centro',
      restaurantAddress: 'Av. Mariscal López 1234, Asunción, Paraguay',
      restaurantPhone: '+595 21 123-4567',
      restaurantRuc: '1234567-8',
      ivaRate: 10,
      printerIp: '192.168.1.100',
      printerPort: 9100,
      paperWidth: 58,
      logoUrl: '',
      footerMessage: '¡Gracias por su compra!',
      passwordExpiryDays: 90,
      maxFailedAttempts: 5,
      sessionTimeoutMinutes: 60,
      enableAuditLog: true,
      autoBackup: false,
      backupFrequency: 'weekly',
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Users created:')
  console.log('  - admin (SYSADMIN) - password: admin123')
  console.log('  - manager (ADMIN) - password: admin123')
  console.log('  - cajero (USER) - password: admin123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
