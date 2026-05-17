'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listAppointments } from '@/lib/api/client'
import { subscribeDataChanged } from '@/lib/api/events'
import { Appointment } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, UserCheck } from 'lucide-react'

export function AttendedToday() {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    let active = true

    const load = async () => {
      const items = await listAppointments({
        date: format(new Date(), 'yyyy-MM-dd'),
      })

      if (active) {
        setAppointments(items)
      }
    }

    load()
    const unsubscribe = subscribeDataChanged(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const attendedAppointments = appointments.filter((appointment) => appointment.estado === 'asistio')

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Atendidos hoy</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-success/20 text-success">
            <UserCheck className="mr-1 h-3 w-3" />
            {attendedAppointments.length} pacientes
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {attendedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <UserCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No hay pacientes atendidos hoy
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendedAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {appointment.hora}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {appointment.patient?.apellido}, {appointment.patient?.nombre}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {appointment.patient?.dni}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                      {appointment.observaciones || '-'}
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
            <p className="text-2xl font-bold text-success">{attendedAppointments.length}</p>
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
  )
}
