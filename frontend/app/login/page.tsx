'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { useAuthSession } from '@/lib/hooks/use-auth-session'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuthSession(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [loading, router, user])

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <LoginForm />
    </main>
  )
}
