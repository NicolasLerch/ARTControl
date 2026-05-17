'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listAppointments } from '@/lib/api/client'
import { subscribeDataChanged } from '@/lib/api/events'
import { Appointment } from '@/lib/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppointmentCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    let active = true

    const loadAppointments = async () => {
      const monthStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
      const monthEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
      const items = await listAppointments({
        from: format(monthStart, 'yyyy-MM-dd'),
        to: format(monthEnd, 'yyyy-MM-dd'),
      })

      if (active) {
        setAppointments(items)
      }
    }

    loadAppointments()
    const unsubscribe = subscribeDataChanged(loadAppointments)

    return () => {
      active = false
      unsubscribe()
    }
  }, [currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const getAppointmentsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return appointments.filter((appointment) => appointment.fecha === dateStr)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calendario</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setCurrentMonth(new Date())
              setSelectedDate(new Date())
            }}>
              Hoy
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center text-sm font-medium capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {days.map((day, idx) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative flex min-h-[80px] flex-col items-center rounded-lg p-1 text-sm transition-colors hover:bg-accent',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isToday && !isSelected && 'bg-accent'
                )}
              >
                <span className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full',
                  isToday && !isSelected && 'bg-primary text-primary-foreground'
                )}>
                  {format(day, 'd')}
                </span>

                {dayAppointments.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {dayAppointments.length <= 3 ? (
                      dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            appointment.estado === 'pendiente' && 'bg-warning',
                            appointment.estado === 'asistio' && 'bg-success',
                            appointment.estado === 'no_asistio' && 'bg-destructive',
                            appointment.estado === 'cancelado' && 'bg-muted-foreground',
                            isSelected && 'bg-primary-foreground/70'
                          )}
                        />
                      ))
                    ) : (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'h-5 px-1.5 text-[10px]',
                          isSelected && 'bg-primary-foreground/20 text-primary-foreground'
                        )}
                      >
                        {dayAppointments.length}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span>Asistió</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span>No asistió</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
