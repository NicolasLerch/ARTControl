'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createAttendance, deleteAttendance, listAppointments, listAttendances, listPatients } from '@/lib/api/client'
import { emitDataChanged, subscribeDataChanged } from '@/lib/api/events'
import { Appointment, AttendanceRecord, Patient } from '@/lib/types'
import { CreatePatientModal } from '@/components/patients/create-patient-modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, MoreVertical, Pencil, Search, Trash2, User, UserCheck, UserPlus } from 'lucide-react'

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function currentTimeValue() {
  return format(new Date(), 'HH:mm')
}

function buildAttendanceDateTime(date: string, time?: string) {
  if (!time) return date

  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return localDate.toISOString()
}

function ensurePatient(patient?: Appointment['patient'] | AttendanceRecord['patient']): Patient | undefined {
  if (!patient) {
    return undefined
  }

  return {
    id: patient.id,
    nombre: patient.nombre,
    apellido: patient.apellido,
    dni: patient.dni,
    createdAt: 'createdAt' in patient ? (patient.createdAt ?? '') : '',
    updatedAt: 'updatedAt' in patient ? patient.updatedAt : undefined,
  }
}

interface RegisterAttendedPatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string
}

function RegisterAttendedPatientModal({ open, onOpenChange, selectedDate }: RegisterAttendedPatientModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showCreatePatient, setShowCreatePatient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    observaciones: '',
    hora: currentTimeValue(),
  })

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

    searchPatients()

    return () => {
      active = false
    }
  }, [searchQuery])

  const resetForm = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedPatient(null)
    setFormData({
      observaciones: '',
      hora: currentTimeValue(),
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    } else {
      setFormData((prev) => ({ ...prev, hora: currentTimeValue() }))
    }
    onOpenChange(nextOpen)
  }

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowCreatePatient(false)
    setSearchQuery('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedPatient) return

    setLoading(true)
    try {
      await createAttendance({
        patientId: selectedPatient.id,
        fechaAtencion: buildAttendanceDateTime(selectedDate, formData.hora),
        observaciones: formData.observaciones,
      })
      emitDataChanged()
      handleOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar paciente atendido</DialogTitle>
            <DialogDescription>
              Busca un paciente por DNI o apellido. Si no existe, puedes crearlo y dejarlo registrado como atendido hoy.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {!selectedPatient ? (
              <div className="space-y-3">
                <Label>Paciente *</Label>
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

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(event) => setFormData((prev) => ({ ...prev, hora: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input value={selectedDate} disabled readOnly type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(event) => setFormData((prev) => ({ ...prev, observaciones: event.target.value }))}
                  placeholder="Observaciones de la atencion"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedPatient || loading}>
                {loading ? 'Guardando...' : 'Registrar atendido'}
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

export function AttendedToday() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [manualAttendances, setManualAttendances] = useState<AttendanceRecord[]>([])
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [showRegisterAttended, setShowRegisterAttended] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    let active = true

    const load = async () => {
      const [appointmentItems, attendanceItems] = await Promise.all([
        listAppointments({
          date: selectedDate,
        }),
        listAttendances({
          date: selectedDate,
        }),
      ])

      if (active) {
        setAppointments(appointmentItems)
        setManualAttendances(attendanceItems)
      }
    }

    load()
    const unsubscribe = subscribeDataChanged(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [selectedDate])

  const attendedAppointments = appointments.filter((appointment) => appointment.estado === 'asistio')
  const manualOnlyAttendances = manualAttendances.filter((attendance) => !attendance.appointmentId)
  const attendedRows = [
    ...attendedAppointments.map((appointment) => ({
      key: `appt-${appointment.id}`,
      attendanceId: manualAttendances.find((attendance) => attendance.appointmentId === appointment.id)?.id ?? null,
      hora: appointment.hora,
      observaciones: appointment.observaciones,
      patient: ensurePatient(appointment.patient),
    })),
    ...manualOnlyAttendances.map((attendance) => ({
      key: `attendance-${attendance.id}`,
      attendanceId: attendance.id,
      hora: new Date(attendance.fechaAtencion ?? '').toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      observaciones: attendance.observaciones,
      patient: ensurePatient(attendance.patient),
    })),
  ].sort((a, b) => a.hora.localeCompare(b.hora))

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient)
    setShowPatientModal(true)
  }

  const handleDeleteAttendance = async (row: typeof attendedRows[number]) => {
    if (!row.patient || !row.attendanceId) return

    const confirmed = window.confirm(
      `Se eliminara la atencion de ${row.patient.apellido}, ${row.patient.nombre} para esta fecha. El paciente seguira existiendo en la base de datos. ¿Continuar?`
    )

    if (!confirmed) return

    await deleteAttendance(row.attendanceId)
    emitDataChanged()
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pacientes atendidos</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(parseLocalDate(selectedDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-[170px]"
              />
              <Badge variant="secondary" className="bg-success/20 text-success">
                <UserCheck className="mr-1 h-3 w-3" />
                {attendedRows.length} pacientes
              </Badge>
              <Button onClick={() => setShowRegisterAttended(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar paciente
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {attendedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <UserCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                No hay pacientes atendidos para la fecha seleccionada
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px]">Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendedRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {row.hora}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.patient?.apellido}, {row.patient?.nombre}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.patient?.dni}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                        {row.observaciones || '-'}
                      </TableCell>
                      <TableCell>
                        {row.patient ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPatient(row.patient!)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar paciente
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteAttendance(row)}
                                disabled={!row.attendanceId}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar atencion
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{appointments.length}</p>
              <p className="text-xs text-muted-foreground">Total turnos</p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center">
              <p className="text-2xl font-bold text-success">{attendedRows.length}</p>
              <p className="text-xs text-muted-foreground">Atendidos</p>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-center">
              <p className="text-2xl font-bold text-warning-foreground">
                {appointments.filter((appointment) => appointment.estado === 'pendiente').length}
              </p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {appointments.filter((appointment) => appointment.estado === 'no_asistio').length}
              </p>
              <p className="text-xs text-muted-foreground">Ausentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RegisterAttendedPatientModal
        open={showRegisterAttended}
        onOpenChange={setShowRegisterAttended}
        selectedDate={selectedDate}
      />

      <CreatePatientModal
        open={showPatientModal}
        onOpenChange={(open) => {
          setShowPatientModal(open)
          if (!open) {
            setEditingPatient(null)
          }
        }}
        onPatientCreated={() => {
          emitDataChanged()
          setEditingPatient(null)
        }}
        patientToEdit={editingPatient}
      />
    </>
  )
}
