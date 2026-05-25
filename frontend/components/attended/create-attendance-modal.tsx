'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Search, User, UserPlus } from 'lucide-react'

import {
  createAttendance,
  listPatients,
  updateAppointment,
  updateAttendance,
} from '@/lib/api/client'
import { emitDataChanged } from '@/lib/api/events'
import { getFormErrorState, type FormFieldErrors } from '@/lib/forms'
import { Appointment, AttendanceRecord, Patient } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { CreatePatientModal } from '@/components/patients/create-patient-modal'

function currentTimeValue() {
  return format(new Date(), 'HH:mm')
}

function buildAttendanceDateTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()
}

function getDateValue(dateTime: string) {
  return format(new Date(dateTime), 'yyyy-MM-dd')
}

function getTimeValue(dateTime: string) {
  return format(new Date(dateTime), 'HH:mm')
}

interface CreateAttendanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string
  attendanceToEdit?: AttendanceRecord | null
  linkedAppointment?: Appointment | null
}

export function CreateAttendanceModal({
  open,
  onOpenChange,
  selectedDate,
  attendanceToEdit = null,
  linkedAppointment = null,
}: CreateAttendanceModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showCreatePatient, setShowCreatePatient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})
  const [formData, setFormData] = useState({
    fecha: selectedDate,
    hora: currentTimeValue(),
    observaciones: '',
  })
  const isEditing = Boolean(attendanceToEdit)

  useEffect(() => {
    let active = true

    const searchPatients = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      const results = await listPatients({ q: searchQuery, pageSize: 10 })

      if (active) {
        setSearchResults(results.items)
      }
    }

    void searchPatients()

    return () => {
      active = false
    }
  }, [searchQuery])

  useEffect(() => {
    if (!open) {
      return
    }

    setFieldErrors({})

    if (attendanceToEdit) {
      setSelectedPatient((attendanceToEdit.patient as Patient | undefined) ?? linkedAppointment?.patient ?? null)
      setFormData({
        fecha: linkedAppointment?.fecha ?? getDateValue(attendanceToEdit.fechaAtencion ?? new Date().toISOString()),
        hora: linkedAppointment?.hora ?? getTimeValue(attendanceToEdit.fechaAtencion ?? new Date().toISOString()),
        observaciones: attendanceToEdit.observaciones || linkedAppointment?.observaciones || '',
      })
      return
    }

    setSelectedPatient(null)
    setFormData({
      fecha: selectedDate,
      hora: currentTimeValue(),
      observaciones: '',
    })
  }, [attendanceToEdit, linkedAppointment, open, selectedDate])

  const resetForm = () => {
    setSearchQuery('')
    setSearchResults([])
    setFieldErrors({})
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowCreatePatient(false)
    setSearchQuery('')
    emitDataChanged()
  }

  const clearFieldError = (field: keyof FormFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedPatient) return

    setLoading(true)
    setFieldErrors({})

    try {
      const fechaAtencion = buildAttendanceDateTime(formData.fecha, formData.hora)

      if (attendanceToEdit) {
        await updateAttendance(attendanceToEdit.id, {
          patientId: selectedPatient.id,
          fechaAtencion,
          observaciones: formData.observaciones,
        })

        if (attendanceToEdit.appointmentId) {
          await updateAppointment(attendanceToEdit.appointmentId, {
            patientId: selectedPatient.id,
            fecha: formData.fecha,
            hora: formData.hora,
            observaciones: formData.observaciones,
          })
        }
      } else {
        await createAttendance({
          patientId: selectedPatient.id,
          fechaAtencion,
          observaciones: formData.observaciones,
        })
      }

      emitDataChanged()
      handleOpenChange(false)
      toast({
        title: isEditing ? 'Atencion actualizada' : 'Atencion registrada',
        description: isEditing
          ? 'Los cambios de la atencion se guardaron correctamente.'
          : 'La atencion se guardo correctamente.',
      })
    } catch (error) {
      const formError = getFormErrorState(error, {
        validationMessage: 'Revisa los datos ingresados',
        fallbackMessage: isEditing ? 'No se pudo actualizar la atencion' : 'No se pudo registrar la atencion',
      })

      setFieldErrors(formError.fieldErrors)
      toast({
        variant: 'destructive',
        title: isEditing ? 'No se pudo actualizar la atencion' : 'No se pudo registrar la atencion',
        description: formError.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar atencion' : 'Agregar paciente atendido'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modifica paciente, fecha, hora y observaciones del registro de atencion.'
                : 'Busca un paciente por DNI o apellido. Si no existe, puedes crearlo y dejarlo registrado como atendido hoy.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!selectedPatient ? (
                <Field>
                  <FieldLabel>Paciente *</FieldLabel>
                  <FieldContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Buscar por DNI o apellido..."
                        className="pl-9"
                      />
                    </div>

                    {searchQuery.length >= 2 && (
                      <div className="rounded-lg border border-border">
                        {searchResults.length > 0 ? (
                          <ScrollArea className="max-h-[200px]">
                            {searchResults.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(patient)
                                  setSearchQuery('')
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {patient.apellido}, {patient.nombre}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    DNI: {patient.dni}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </ScrollArea>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              No se encontraron pacientes
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCreatePatient(true)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Crear paciente
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {searchQuery.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowCreatePatient(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear nuevo paciente
                      </Button>
                    )}
                  </FieldContent>
                </Field>
              ) : (
                <Field>
                  <FieldLabel>Paciente seleccionado</FieldLabel>
                  <FieldContent>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedPatient.apellido}, {selectedPatient.nombre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            DNI: {selectedPatient.dni}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPatient(null)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  </FieldContent>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={fieldErrors.fechaAtencion?.length ? true : undefined}>
                  <FieldLabel htmlFor="fecha-atencion">Fecha *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="fecha-atencion"
                      type="date"
                      value={formData.fecha}
                      onChange={(event) => {
                        setFormData((prev) => ({ ...prev, fecha: event.target.value }))
                        clearFieldError('fechaAtencion')
                      }}
                      aria-invalid={fieldErrors.fechaAtencion?.length ? true : undefined}
                      required
                    />
                    <FieldError errors={fieldErrors.fechaAtencion?.map((message) => ({ message }))} />
                  </FieldContent>
                </Field>

                <Field data-invalid={fieldErrors.fechaAtencion?.length ? true : undefined}>
                  <FieldLabel htmlFor="hora-atencion">Hora *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="hora-atencion"
                      type="time"
                      value={formData.hora}
                      onChange={(event) => {
                        setFormData((prev) => ({ ...prev, hora: event.target.value }))
                        clearFieldError('fechaAtencion')
                      }}
                      aria-invalid={fieldErrors.fechaAtencion?.length ? true : undefined}
                      required
                    />
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="observaciones-atencion">Observaciones</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="observaciones-atencion"
                    value={formData.observaciones}
                    onChange={(event) => setFormData((prev) => ({ ...prev, observaciones: event.target.value }))}
                    placeholder="Notas"
                    rows={3}
                  />
                </FieldContent>
              </Field>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedPatient || loading}>
                {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Registrar atendido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreatePatientModal
        open={showCreatePatient}
        onOpenChange={setShowCreatePatient}
        onPatientCreated={handlePatientCreated}
        initialDni={searchQuery.match(/^\d+$/) ? searchQuery : ''}
      />
    </>
  )
}
