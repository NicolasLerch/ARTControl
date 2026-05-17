'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApiError, getCurrentUser } from '@/lib/api/client'
import { AuthUser } from '@/lib/types'

export function useAuthSession(redirectToLogin = true) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        const nextUser = await getCurrentUser()
        if (active) {
          setUser(nextUser)
        }
      } catch (error) {
        if (active) {
          setUser(null)
        }

        if (redirectToLogin && error instanceof ApiError && error.status === 401) {
          router.replace('/login')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      active = false
    }
  }, [redirectToLogin, router])

  return {
    user,
    loading,
    setUser,
  }
}
