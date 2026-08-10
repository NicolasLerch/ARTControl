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
import { createPatientCase, updatePatientCase } from '@/lib/api/client'
import { emitDataChanged } from '@/lib/api/events'
import { getFormErrorState, type FormFieldErrors } from '@/lib/forms'
import { PatientCase } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

interface PatientCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientCaseToEdit?: PatientCase | null
  onSaved?: (patientCase: PatientCase) => void
}

export function PatientCaseModal({
  open,
  onOpenChange,
  patientId,
  patientCaseToEdit = null,
  onSaved,
}: PatientCaseModalProps) {
  const [formData, setFormData] = useState({
    art: '',
    numeroSiniestro: '',
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})

  useEffect(() => {
    if (!open) {
      return
    }

    setFieldErrors({})
    setFormData({
      art: patientCaseToEdit?.art ?? '',
      numeroSiniestro: patientCaseToEdit?.numeroSiniestro ?? '',
    })
  }, [open, patientCaseToEdit])

  const updateField = (field: 'art' | 'numeroSiniestro', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const nextErrors = { ...prev }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setFieldErrors({})

    try {
      const savedCase = patientCaseToEdit
        ? await updatePatientCase(patientId, patientCaseToEdit.id, formData)
        : await createPatientCase(patientId, formData)

      onSaved?.(savedCase)
      emitDataChanged()
      onOpenChange(false)
      toast({
        title: patientCaseToEdit ? 'Caso actualizado' : 'Caso agregado',
        description: patientCaseToEdit
          ? 'Los datos del caso se guardaron correctamente.'
          : 'El caso se guardo correctamente.',
      })
    } catch (error) {
      const formError = getFormErrorState(error, {
        validationMessage: 'Revisa los datos del caso',
        fallbackMessage: patientCaseToEdit ? 'No se pudo actualizar el caso' : 'No se pudo guardar el caso',
      })

      setFieldErrors(formError.fieldErrors)
      toast({
        variant: 'destructive',
        title: patientCaseToEdit ? 'No se pudo actualizar el caso' : 'No se pudo guardar el caso',
        description: formError.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{patientCaseToEdit ? 'Editar caso' : 'Nuevo caso'}</DialogTitle>
          <DialogDescription>
            Cada caso guarda ART y numero de siniestro para usar al emitir recetas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Field data-invalid={fieldErrors.art?.length ? true : undefined}>
              <FieldLabel htmlFor="case-art">ART *</FieldLabel>
              <Input
                id="case-art"
                value={formData.art}
                onChange={(e) => updateField('art', e.target.value)}
                placeholder="Ej. Provincia ART"
                aria-invalid={fieldErrors.art?.length ? true : undefined}
                required
              />
              <FieldError errors={fieldErrors.art?.map((message) => ({ message }))} />
            </Field>

            <Field data-invalid={fieldErrors.numeroSiniestro?.length ? true : undefined}>
              <FieldLabel htmlFor="case-numeroSiniestro">N° de siniestro *</FieldLabel>
              <Input
                id="case-numeroSiniestro"
                value={formData.numeroSiniestro}
                onChange={(e) => updateField('numeroSiniestro', e.target.value)}
                placeholder="Numero de siniestro"
                aria-invalid={fieldErrors.numeroSiniestro?.length ? true : undefined}
                required
              />
              <FieldError errors={fieldErrors.numeroSiniestro?.map((message) => ({ message }))} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : patientCaseToEdit ? 'Guardar cambios' : 'Guardar caso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
