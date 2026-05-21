'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { listMedications, ApiError } from '@/lib/api/client'
import { subscribeDataChanged } from '@/lib/api/events'
import { Medication } from '@/lib/types'
import { Search, Pill, Building, FlaskConical, Copy } from 'lucide-react'

export function Vademecum() {
  const [searchQuery, setSearchQuery] = useState('')
  const [medications, setMedications] = useState<Medication[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleCopyRecipe = async (medication: Medication) => {
    const recipeText = `${medication.droga} ${medication.dosis} ${medication.nombreComercial} ${medication.presentacion}`
      .replace(/\s+/g, ' ')
      .trim()

    try {
      await navigator.clipboard.writeText(recipeText)
    } catch {
      // no-op: no interrumpir la UX si el navegador bloquea el portapapeles
    }
  }

  useEffect(() => {
    let active = true

    const loadMedications = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await listMedications({
          q: searchQuery || undefined,
          pageSize: 100,
        })

        if (active) {
          setMedications(response.items)
          setTotal(response.total)
        }
      } catch (err) {
        if (!active) {
          return
        }

        setMedications([])
        setTotal(0)

        if (err instanceof ApiError && err.status === 401) {
          setError('Tu sesión venció. Volvé a iniciar sesión.')
          return
        }

        setError('No se pudo cargar el vademécum.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(loadMedications, 250)
    const unsubscribe = subscribeDataChanged(loadMedications)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [searchQuery])

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Vademécum</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Medicamentos de uso frecuente en medicina laboral
            </p>
          </div>
          <Badge variant="secondary">
            <Pill className="mr-1 h-3 w-3" />
            {loading ? 'Cargando...' : `${total} medicamentos`}
          </Badge>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por droga, nombre comercial o laboratorio..."
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Spinner className="mr-2 h-4 w-4" />
            Cargando vademécum...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Pill className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verificá la conexión con el backend y la sesión activa.
            </p>
          </div>
        ) : medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Pill className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {searchQuery ? 'No se encontraron medicamentos' : 'No hay medicamentos cargados'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Droga</TableHead>
                  <TableHead>Nombre comercial</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((med) => (
                  <TableRow key={med.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FlaskConical className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{med.droga || med.nombreComercial}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{med.nombreComercial}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {med.dosis}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span className="text-sm">{med.laboratorio}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {med.presentacion}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Copiar receta de ${med.nombreComercial}`}
                        title="Copiar receta"
                        onClick={() => void handleCopyRecipe(med)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Usage info */}
        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium">Nota importante</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Este vademécum es una referencia rápida. Consulte siempre el prospecto oficial 
            y verifique contraindicaciones antes de prescribir.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
