import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str
}

export async function logSystemEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, any>
) {
  const { prisma } = await import('./prisma')
  
  await prisma.systemLog.create({
    data: {
      level,
      message,
      metadata: metadata || {},
    },
  })
}
