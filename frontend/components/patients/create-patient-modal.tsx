'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPatient } from '@/lib/api/client'
import { Patient } from '@/lib/types'

interface CreatePatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatientCreated?: (patient: Patient) => void
  initialDni?: string
}

export function CreatePatientModal({ open, onOpenChange, onPatientCreated, initialDni = '' }: CreatePatientModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: initialDni,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({ ...prev, dni: initialDni }))
    }
  }, [initialDni, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const newPatient = await createPatient(formData)
      onPatientCreated?.(newPatient)
      onOpenChange(false)
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: 'nombre' | 'apellido' | 'dni', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
          <DialogDescription>
            Para el MVP sólo guardamos nombre, apellido y DNI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => updateField('apellido', e.target.value)}
                  placeholder="Apellido"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => updateField('dni', e.target.value)}
                placeholder="12345678"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
