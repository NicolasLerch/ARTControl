'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ApiError, confirmTwoFactor, setupTwoFactor } from '@/lib/api/client'
import { AuthUser } from '@/lib/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

interface TwoFactorSetupCardProps {
  user: AuthUser
  onEnabled: (user: AuthUser) => void
}

export function TwoFactorSetupCard({ user, onEnabled }: TwoFactorSetupCardProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user.totpEnabled) {
    return null
  }

  const handleSetup = async () => {
    setLoading(true)
    setError(null)

    try {
      const setup = await setupTwoFactor()
      setQrCodeDataUrl(setup.qrCodeDataUrl)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el setup de 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await confirmTwoFactor(token)
      onEnabled(response.user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo confirmar el 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-warning/40">
      <CardHeader>
        <CardTitle>Configurar segundo factor</CardTitle>
        <CardDescription>
          Tu usuario todavía no tiene 2FA activo. Antes de usar el sistema, configurá tu autenticador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!qrCodeDataUrl ? (
          <Button disabled={loading} onClick={handleSetup}>
            {loading ? 'Generando...' : 'Generar QR'}
          </Button>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="rounded-lg border border-border p-3">
              <Image alt="QR 2FA" height={180} src={qrCodeDataUrl} width={180} />
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escaneá el QR con Google Authenticator, Authy o Microsoft Authenticator y confirmá un código.
              </p>
              <InputOTP maxLength={6} value={token} onChange={setToken}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button disabled={loading || token.length !== 6} onClick={handleConfirm}>
                {loading ? 'Confirmando...' : 'Activar 2FA'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
