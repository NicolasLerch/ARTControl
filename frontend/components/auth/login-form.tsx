'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApiError, login } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = setInterval(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const handleCredentials = async (event: FormEvent) => {
    event.preventDefault()
    if (cooldownSeconds > 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      router.replace('/')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429 || err.code === 'RATE_LIMITED') {
          const retryAfter = err.retryAfterSeconds ?? 60
          setCooldownSeconds(retryAfter)
          setError(`Demasiados intentos de login. Reintentá en ${retryAfter}s.`)
        } else if (err.status === 401) {
          setError('Credenciales inválidas')
        } else {
          setError(err.message || 'No se pudo iniciar sesión')
        }
      } else {
        setError('No se pudo iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ingresar</CardTitle>
        <CardDescription>Accedé con email y contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={handleCredentials}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button className="w-full" disabled={loading || cooldownSeconds > 0} type="submit">
              {loading ? 'Validando...' : cooldownSeconds > 0 ? `Reintentar en ${cooldownSeconds}s` : 'Continuar'}
            </Button>
          </form>
      </CardContent>
    </Card>
  )
}
