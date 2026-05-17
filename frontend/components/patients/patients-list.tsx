'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { listPatients } from '@/lib/api/client'
import { subscribeDataChanged } from '@/lib/api/events'
import { Patient } from '@/lib/types'
import { CreatePatientModal } from './create-patient-modal'
import { PatientDetail } from './patient-detail'
import { Search, UserPlus, User } from 'lucide-react'

interface PatientsListProps {
  onAddAppointment: () => void
}

export function PatientsList({ onAddAppointment }: PatientsListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    let active = true

    const loadPatients = async () => {
      const response = await listPatients({
        q: searchQuery || undefined,
        pageSize: 100,
      })

      if (active) {
        setPatients(response.items)
        if (!selectedPatientId && response.items.length > 0) {
          setSelectedPatientId(response.items[0].id)
        }
      }
    }

    loadPatients()
    const unsubscribe = subscribeDataChanged(loadPatients)

    return () => {
      active = false
      unsubscribe()
    }
  }, [searchQuery, selectedPatientId])

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pacientes</CardTitle>
              <Badge variant="secondary">{patients.length} registrados</Badge>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por DNI, nombre o apellido..."
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent/50 ${
                        selectedPatientId === patient.id
                          ? 'border-primary bg-accent'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {patient.apellido}, {patient.nombre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            DNI: {patient.dni}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {selectedPatientId ? (
          <PatientDetail patientId={selectedPatientId} onScheduleAppointment={onAddAppointment} />
        ) : (
          <Card className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto rounded-full bg-muted p-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Seleccioná un paciente para ver su detalle
              </p>
            </div>
          </Card>
        )}
      </div>

      <CreatePatientModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  )
}
