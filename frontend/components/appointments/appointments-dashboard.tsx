'use client'

import { AppointmentCalendar } from './appointment-calendar'
import { TodayAppointments } from './today-appointments'

interface AppointmentsDashboardProps {
  onAddAppointment: () => void
}

export function AppointmentsDashboard({ onAddAppointment }: AppointmentsDashboardProps) {
  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <AppointmentCalendar />
      </div>
      <div className="lg:col-span-2">
        <TodayAppointments onAddAppointment={onAddAppointment} />
      </div>
    </div>
  )
}
