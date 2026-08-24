'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, FileText, MoreVertical, Pencil, Trash2, UserCheck, UserPlus } from 'lucide-react'

import { deleteAttendance, getPatientDetail, listAppointments, listAttendances } from '@/lib/api/client'
import { emitDataChanged, subscribeDataChanged } from '@/lib/api/events'
import { Appointment, AttendanceRecord, Patient, PatientCase } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreateAttendanceModal } from '@/components/attended/create-attendance-modal'
import { PrescriptionModal } from '@/components/patients/prescription-modal'

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
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

function formatAttendanceTime(attendance: AttendanceRecord, fallbackHour?: string) {
  if (!attendance.fechaAtencion) {
    return fallbackHour ?? '--:--'
  }

  const localTime = format(new Date(attendance.fechaAtencion), 'HH:mm')
  return localTime === '00:00' && fallbackHour ? fallbackHour : localTime
}

type AttendedRow = {
  key: string
  attendance: AttendanceRecord | null
  appointment: Appointment | null
  patient?: Patient
  hora: string
  observaciones: string
}

export function AttendedToday() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null)
  const [prescriptionPatient, setPrescriptionPatient] = useState<Patient | null>(null)
  const [prescriptionCases, setPrescriptionCases] = useState<PatientCase[]>([])
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    let active = true

    const load = async () => {
      const [appointmentItems, attendanceItems] = await Promise.all([
        listAppointments({ date: selectedDate }),
        listAttendances({ date: selectedDate }),
      ])

      if (active) {
        setAppointments(appointmentItems)
        setAttendances(attendanceItems)
      }
    }

    void load()
    const unsubscribe = subscribeDataChanged(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [selectedDate])

  const attendedRows = useMemo<AttendedRow[]>(() => {
    const attendanceByAppointmentId = new Map(
      attendances
        .filter((attendance) => attendance.appointmentId)
        .map((attendance) => [attendance.appointmentId as string, attendance]),
    )

    const appointmentRows = appointments
      .filter((appointment) => appointment.estado === 'asistio')
      .map((appointment) => {
        const attendance = attendanceByAppointmentId.get(appointment.id)

        return {
          key: attendance ? `attendance-${attendance.id}` : `appointment-${appointment.id}`,
          attendance: attendance ?? null,
          appointment,
          patient: ensurePatient(attendance?.patient ?? appointment.patient),
          hora: attendance ? formatAttendanceTime(attendance, appointment.hora) : appointment.hora,
          observaciones: attendance?.observaciones || appointment.observaciones || '',
        }
      })

    const manualRows = attendances
      .filter((attendance) => !attendance.appointmentId)
      .map((attendance) => ({
        key: `attendance-${attendance.id}`,
        attendance,
        appointment: null,
        patient: ensurePatient(attendance.patient),
        hora: formatAttendanceTime(attendance),
        observaciones: attendance.observaciones || '',
      }))

    return [...appointmentRows, ...manualRows].sort((a, b) => a.hora.localeCompare(b.hora))
  }, [appointments, attendances])

  const handleEditAttendance = (row: AttendedRow) => {
    setEditingAttendance(row.attendance)
    setShowAttendanceModal(true)
  }

  const handleDeleteAttendance = async (row: AttendedRow) => {
    if (!row.patient || !row.attendance) return

    const confirmed = window.confirm(
      `Se eliminara la atencion de ${row.patient.apellido}, ${row.patient.nombre} para esta fecha. El paciente seguira existiendo en la base de datos. ¿Continuar?`,
    )

    if (!confirmed) return

    await deleteAttendance(row.attendance.id)
    emitDataChanged()
  }

  const handleGeneratePrescription = async (patientId: string) => {
    try {
      const detail = await getPatientDetail(patientId)
      setPrescriptionPatient(detail.patient)
      setPrescriptionCases(detail.cases)
    } catch {
      // The shared API client displays the request error; avoid opening an incomplete modal.
    }
  }

  const refreshPrescriptionCases = async () => {
    if (!prescriptionPatient) return

    const detail = await getPatientDetail(prescriptionPatient.id)
    setPrescriptionPatient(detail.patient)
    setPrescriptionCases(detail.cases)
  }

  const linkedAppointment = editingAttendance?.appointmentId
    ? appointments.find((appointment) => appointment.id === editingAttendance.appointmentId) ?? null
    : null

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
              <Button onClick={() => setShowAttendanceModal(true)}>
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
                              <DropdownMenuItem onClick={() => handleGeneratePrescription(row.patient!.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Generar receta
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => row.attendance && handleEditAttendance(row)} disabled={!row.attendance}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar atencion
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteAttendance(row)}
                                disabled={!row.attendance}
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

      <CreateAttendanceModal
        open={showAttendanceModal}
        onOpenChange={(open) => {
          setShowAttendanceModal(open)
          if (!open) {
            setEditingAttendance(null)
          }
        }}
        selectedDate={selectedDate}
        attendanceToEdit={editingAttendance}
        linkedAppointment={linkedAppointment}
      />

      {prescriptionPatient ? (
        <PrescriptionModal
          open={Boolean(prescriptionPatient)}
          onOpenChange={(open) => {
            if (!open) {
              setPrescriptionPatient(null)
              setPrescriptionCases([])
            }
          }}
          patient={prescriptionPatient}
          cases={prescriptionCases}
          onCasesChanged={refreshPrescriptionCases}
        />
      ) : null}
    </>
  )
}
