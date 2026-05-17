'use client'

import { useState } from 'react'
import { AppointmentCalendar } from './appointment-calendar'
import { TodayAppointments } from './today-appointments'

interface AppointmentsDashboardProps {
  onAddAppointment: (date: Date) => void
}

export function AppointmentsDashboard({ onAddAppointment }: AppointmentsDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <AppointmentCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>
      <div className="lg:col-span-2">
        <TodayAppointments onAddAppointment={() => onAddAppointment(selectedDate)} selectedDate={selectedDate} />
      </div>
    </div>
  )
}
