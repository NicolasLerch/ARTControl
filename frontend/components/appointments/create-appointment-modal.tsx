'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createAppointment, listPatients } from '@/lib/api/client'
import { emitDataChanged } from '@/lib/api/events'
import { Patient } from '@/lib/types'
import { CreatePatientModal } from '../patients/create-patient-modal'
import { Search, User, UserPlus } from 'lucide-react'
import { format } from 'date-fns'

interface CreateAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
}

export function CreateAppointmentModal({ open, onOpenChange, initialDate }: CreateAppointmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showCreatePatient, setShowCreatePatient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fecha: initialDate ?? format(new Date(), 'yyyy-MM-dd'),
    hora: '09:00',
    observaciones: ''
  })

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        fecha: initialDate ?? format(new Date(), 'yyyy-MM-dd'),
      }))
    }
  }, [initialDate, open])

  useEffect(() => {
    let active = true

    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      const results = await listPatients({ q: searchQuery, pageSize: 10 })

      if (active) {
        setSearchResults(results.items)
      }
    }

    search()

    return () => {
      active = false
    }
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    setLoading(true)
    try {
      await createAppointment({
        patientId: selectedPatient.id,
        fecha: formData.fecha,
        hora: formData.hora,
        observaciones: formData.observaciones
      })

      emitDataChanged()
      onOpenChange(false)
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedPatient(null)
    setFormData({
      fecha: initialDate ?? format(new Date(), 'yyyy-MM-dd'),
      hora: '09:00',
      observaciones: ''
    })
  }

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowCreatePatient(false)
    setSearchQuery('')
    emitDataChanged()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuevo turno</DialogTitle>
            <DialogDescription>
              Buscá por DNI o apellido, o cargá un paciente mínimo para agendar el control.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!selectedPatient ? (
                <div className="space-y-3">
                  <Label>Paciente *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Paciente seleccionado</Label>
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
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Motivo del control o nota operativa"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedPatient || loading}>
                {loading ? 'Guardando...' : 'Guardar turno'}
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
