'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, CalendarPlus, CheckCircle2, Clock, FileText, User, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getPatientDetail } from '@/lib/api/client'
import { subscribeDataChanged } from '@/lib/api/events'
import { Patient, PatientTimelineItem } from '@/lib/types'

interface PatientDetailProps {
  patientId: string
  onScheduleAppointment?: () => void
}

const appointmentLabels = {
  PENDIENTE: { icon: Clock, className: 'bg-warning/20 text-warning-foreground border-warning/30', label: 'Turno pendiente' },
  ASISTIO: { icon: CheckCircle2, className: 'bg-success/20 text-success border-success/30', label: 'Asistio' },
  NO_ASISTIO: { icon: XCircle, className: 'bg-destructive/20 text-destructive border-destructive/30', label: 'No asistio' },
  CANCELADO: { icon: XCircle, className: 'bg-muted text-muted-foreground border-border', label: 'Cancelado' },
} as const

function TimelineEntry({ item }: { item: PatientTimelineItem }) {
  const config = item.type === 'appointment' && item.estado
    ? appointmentLabels[item.estado as keyof typeof appointmentLabels]
    : {
        icon: FileText,
        className: 'bg-primary/20 text-primary border-primary/30',
        label: 'Atencion registrada',
      }

  const Icon = config.icon

  return (
    <div className="relative">
      <div className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background ${config.className}`}>
        <Icon className="h-3 w-3" />
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(item.dateTime), "d MMM yyyy - HH:mm", { locale: es })}
          </span>
        </div>
        {item.ownerDisplayName ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Registrado por {item.ownerDisplayName}
          </p>
        ) : null}
        {item.observaciones ? (
          <p className="mt-2 text-sm">{item.observaciones}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sin observaciones</p>
        )}
      </div>
    </div>
  )
}

export function PatientDetail({ patientId, onScheduleAppointment }: PatientDetailProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [timeline, setTimeline] = useState<PatientTimelineItem[]>([])

  useEffect(() => {
    let active = true

    const loadDetail = async () => {
      const data = await getPatientDetail(patientId)

      if (active) {
        setPatient(data.patient)
        setTimeline(data.timeline)
      }
    }

    void loadDetail()
    const unsubscribe = subscribeDataChanged(loadDetail)

    return () => {
      active = false
      unsubscribe()
    }
  }, [patientId])

  if (!patient) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando detalle del paciente...</p>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {patient.apellido}, {patient.nombre}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                DNI: {patient.dni}
              </p>
            </div>
          </div>
          <Button onClick={onScheduleAppointment}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Citar control
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Datos basicos</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.nombre} {patient.apellido}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>DNI {patient.dni}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Alta en turnero: {format(new Date(patient.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Alcance MVP</h3>
              <p className="text-sm text-muted-foreground">
                Este turnero solo conserva identificacion minima y el historial operativo compartido de turnos y atenciones.
              </p>
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Timeline de atenciones y turnos
            </h3>
            <ScrollArea className="flex-1">
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Sin historial todavia
                  </p>
                </div>
              ) : (
                <div className="relative space-y-4 pl-6">
                  <div className="absolute bottom-2 left-[9px] top-2 w-px bg-border" />
                  {timeline.map((record) => (
                    <TimelineEntry key={`${record.type}-${record.id}`} item={record} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
