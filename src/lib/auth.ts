import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { AuthUser, LoginCredentials } from '@/types'

const secretKey = process.env.JWT_SECRET!
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function login(credentials: LoginCredentials): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { username: credentials.username },
    select: {
      id: true,
      name: true,
      lastName: true,
      username: true,
      email: true,
      role: true,
      password: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    return null
  }

  const isValidPassword = await bcrypt.compare(credentials.password, user.password)
  if (!isValidPassword) {
    return null
  }

  // Log the login attempt
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipAddress: '127.0.0.1', // TODO: Get real IP
      userAgent: 'Web Browser', // TODO: Get real user agent
    },
  })

  return {
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role: user.role,
  }
}

export async function createSession(user: AuthUser) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  const session = await encrypt({ user, expires })

  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<AuthUser | null> {
  const session = cookies().get('session')?.value
  if (!session) return null

  try {
    const payload = await decrypt(session)
    return payload.user as AuthUser
  } catch (error) {
    return null
  }
}

export async function logout() {
  cookies().set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    sameSite: 'lax',
    path: '/',
  })
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    USER: 1,
    ADMIN: 2,
    SYSADMIN: 3,
  }

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= 
         roleHierarchy[requiredRole as keyof typeof roleHierarchy]
}


