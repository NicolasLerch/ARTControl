'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApiError, login, verifyTwoFactor } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCredentials = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await login(email, password)

      if (response.requires2fa && response.challengeId) {
        setChallengeId(response.challengeId)
        return
      }

      router.replace('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async (event: FormEvent) => {
    event.preventDefault()

    if (!challengeId) return

    setLoading(true)
    setError(null)

    try {
      await verifyTwoFactor(challengeId, otp)
      router.replace('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo verificar el código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{challengeId ? 'Verificación 2FA' : 'Ingresar'}</CardTitle>
        <CardDescription>
          {challengeId
            ? 'Ingresá el código de 6 dígitos de tu autenticador.'
            : 'Accedé con email, contraseña y segundo factor.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!challengeId ? (
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
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Validando...' : 'Continuar'}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleOtp}>
            <div className="space-y-3">
              <Label>Código OTP</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full" disabled={loading || otp.length !== 6} type="submit">
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
