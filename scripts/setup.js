#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍕 Configurando Sistema de Gestión para Pizzería...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envTemplatePath = path.join(process.cwd(), 'env-template.txt');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo de configuración .env.local...');
  
  if (fs.existsSync(envTemplatePath)) {
    // Copy from template
    const envContent = fs.readFileSync(envTemplatePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado desde plantilla');
  } else {
    // Create default content
    const envContent = `# Database
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
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado');
  }
} else {
  console.log('✅ Archivo .env.local ya existe');
}

// Install dependencies
console.log('\n📦 Instalando dependencias...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencias instaladas');
} catch (error) {
  console.error('❌ Error instalando dependencias:', error.message);
  process.exit(1);
}

// Generate Prisma client
console.log('\n🗄️ Generando cliente Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma generado');
} catch (error) {
  console.error('❌ Error generando cliente Prisma:', error.message);
  process.exit(1);
}

console.log('\n🎉 ¡Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configura tu base de datos PostgreSQL');
console.log('2. Actualiza las variables en .env.local');
console.log('3. Ejecuta: npm run db:push');
console.log('4. Ejecuta: npm run db:seed');
console.log('5. Ejecuta: npm run dev');
console.log('\n👤 Usuarios de prueba:');
console.log('- admin / admin123 (SYSADMIN)');
console.log('- manager / admin123 (ADMIN)');
console.log('- cajero / admin123 (USER)');
console.log('\n🌐 Accede a: http://localhost:3000');
