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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createPatient, updatePatient } from '@/lib/api/client'
import { emitDataChanged } from '@/lib/api/events'
import { getFormErrorState, type FormFieldErrors } from '@/lib/forms'
import { Patient } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

interface CreatePatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatientCreated?: (patient: Patient) => void
  initialDni?: string
  patientToEdit?: Patient | null
}

export function CreatePatientModal({
  open,
  onOpenChange,
  onPatientCreated,
  initialDni = '',
  patientToEdit = null,
}: CreatePatientModalProps) {
  const emptyFormData = {
    nombre: '',
    apellido: '',
    dni: initialDni,
  }
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: initialDni,
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})

  const resetFormState = () => {
    setFieldErrors({})
    setFormData({
      nombre: '',
      apellido: '',
      dni: initialDni,
    })
  }

  useEffect(() => {
    if (!open) return

    setFieldErrors({})

    if (patientToEdit) {
      setFormData({
        nombre: patientToEdit.nombre,
        apellido: patientToEdit.apellido,
        dni: patientToEdit.dni,
      })
      return
    }

    setFormData(emptyFormData)
  }, [initialDni, open, patientToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    try {
      const savedPatient = patientToEdit
        ? await updatePatient(patientToEdit.id, formData)
        : await createPatient(formData)

      onPatientCreated?.(savedPatient)
      emitDataChanged()
      onOpenChange(false)
      setFieldErrors({})
      setFormData(emptyFormData)
      toast({
        title: patientToEdit ? 'Paciente actualizado' : 'Paciente creado',
        description: patientToEdit
          ? 'Los datos del paciente se guardaron correctamente.'
          : 'El paciente se guardo correctamente.',
      })
    } catch (error) {
      const formError = getFormErrorState(error, {
        validationMessage: 'Revisa los datos ingresados',
        conflictMessage: 'Ya existe un paciente con ese DNI',
        conflictField: 'dni',
        fallbackMessage: patientToEdit ? 'No se pudo guardar el paciente' : 'No se pudo guardar el paciente',
      })

      setFieldErrors(formError.fieldErrors)
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar el paciente',
        description: formError.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: 'nombre' | 'apellido' | 'dni', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const nextErrors = { ...prev }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetFormState()
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{patientToEdit ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
          <DialogDescription>
            Para el MVP solo guardamos nombre, apellido y DNI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={fieldErrors.apellido?.length ? true : undefined}>
                <FieldLabel htmlFor="apellido">Apellido *</FieldLabel>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => updateField('apellido', e.target.value)}
                  placeholder="Apellido"
                  aria-invalid={fieldErrors.apellido?.length ? true : undefined}
                  required
                />
                <FieldError errors={fieldErrors.apellido?.map((message) => ({ message }))} />
              </Field>
              <Field data-invalid={fieldErrors.nombre?.length ? true : undefined}>
                <FieldLabel htmlFor="nombre">Nombre *</FieldLabel>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  placeholder="Nombre"
                  aria-invalid={fieldErrors.nombre?.length ? true : undefined}
                  required
                />
                <FieldError errors={fieldErrors.nombre?.map((message) => ({ message }))} />
              </Field>
            </div>

            <Field data-invalid={fieldErrors.dni?.length ? true : undefined}>
              <FieldLabel htmlFor="dni">DNI *</FieldLabel>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => updateField('dni', e.target.value)}
                placeholder="12345678"
                aria-invalid={fieldErrors.dni?.length ? true : undefined}
                required
              />
              <FieldError errors={fieldErrors.dni?.map((message) => ({ message }))} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : patientToEdit ? 'Guardar cambios' : 'Guardar paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
