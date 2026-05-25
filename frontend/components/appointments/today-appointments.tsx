'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { emitDataChanged, subscribeDataChanged } from '@/lib/api/events'
import { listAppointments, updateAppointmentStatus } from '@/lib/api/client'
import { AppointmentStatus, Appointment } from '@/lib/types'
import { CreateAppointmentModal } from './create-appointment-modal'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, User, FileText, MoreVertical, Check, X, Ban, Pencil } from 'lucide-react'

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-warning/20 text-warning-foreground border-warning/30' },
  asistio: { label: 'Asistio', className: 'bg-success/20 text-success border-success/30' },
  no_asistio: { label: 'No asistio', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
}

interface TodayAppointmentsProps {
  onAddAppointment: () => void
  selectedDate: Date
}

export function TodayAppointments({ onAddAppointment, selectedDate }: TodayAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    let active = true

    const loadAppointments = async () => {
      const items = await listAppointments({
        date: format(selectedDate, 'yyyy-MM-dd'),
      })

      if (active) {
        setAppointments(items)
      }
    }

    void loadAppointments()
    const unsubscribe = subscribeDataChanged(loadAppointments)

    return () => {
      active = false
      unsubscribe()
    }
  }, [selectedDate])

  const pendingCount = appointments.filter((appointment) => appointment.estado === 'pendiente').length
  const attendedCount = appointments.filter((appointment) => appointment.estado === 'asistio').length
  const isToday = isSameDay(selectedDate, new Date())
  const title: string = isToday ? 'Turnos de hoy' : `${format(selectedDate, "d 'de' MMMM", { locale: es })}`

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status)
    emitDataChanged()
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setIsEditOpen(true)
  }

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(selectedDate, 'EEEE', { locale: es })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                {pendingCount} pendientes
              </Badge>
              <Badge variant="secondary" className="bg-success/20 text-success">
                {attendedCount} atendidos
              </Badge>
            </div>
          </div>
          <Button onClick={onAddAppointment} className="mt-4 w-full">
            + Agregar turno
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6 pb-6">
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">No hay turnos para la fecha seleccionada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {appointment.patient?.apellido}, {appointment.patient?.nombre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            DNI: {appointment.patient?.dni}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAppointment(appointment)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar turno
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(appointment.id, 'asistio')}>
                            <Check className="mr-2 h-4 w-4 text-success" />
                            Marcar asistio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(appointment.id, 'no_asistio')}>
                            <X className="mr-2 h-4 w-4 text-destructive" />
                            Marcar no asistio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(appointment.id, 'cancelado')}>
                            <Ban className="mr-2 h-4 w-4" />
                            Cancelar turno
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        <Clock className="mr-1 h-3 w-3" />
                        {appointment.hora}
                      </Badge>
                      <Badge className={statusConfig[appointment.estado].className}>
                        {statusConfig[appointment.estado].label}
                      </Badge>
                    </div>

                    {appointment.observaciones && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p>{appointment.observaciones}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <CreateAppointmentModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setEditingAppointment(null)
          }
        }}
        initialDate={format(selectedDate, 'yyyy-MM-dd')}
        appointmentToEdit={editingAppointment}
      />
    </>
  )
}
