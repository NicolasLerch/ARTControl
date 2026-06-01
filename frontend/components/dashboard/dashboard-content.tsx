'use client'

import { format } from 'date-fns'

import { AppointmentsDashboard } from '@/components/appointments/appointments-dashboard'
import { AttendedToday } from '@/components/attended/attended-today'
import { PatientsList } from '@/components/patients/patients-list'
import { PharmaciesList } from '@/components/pharmacies/pharmacies-list'
import { ComingSoonPanel } from '@/components/shared/coming-soon-panel'
import { UsersDashboard } from '@/components/users/users-dashboard'
import { Vademecum } from '@/components/vademecum/vademecum'
import { AuthUser } from '@/lib/types'

interface DashboardContentProps {
  activeTab: string
  user: AuthUser
  onAddAppointment: (date: string) => void
}

export function DashboardContent({ activeTab, user, onAddAppointment }: DashboardContentProps) {
  const currentUserRole = user.role

  const renderContent = () => {
    switch (activeTab) {
      case 'turnos':
        return <AppointmentsDashboard onAddAppointment={(date) => onAddAppointment(format(date, 'yyyy-MM-dd'))} />
      case 'pacientes':
        return <PatientsList onAddAppointment={() => onAddAppointment(format(new Date(), 'yyyy-MM-dd'))} />
      case 'atendidos':
        return <AttendedToday />
      case 'vademecum':
        return <Vademecum userRole={currentUserRole} />
      case 'farmacias':
        return <PharmaciesList userRole={currentUserRole} />
      case 'especialistas':
        return <ComingSoonPanel title="Horarios especialistas" description="La agenda de especialistas queda marcada como proxima funcionalidad." />
      case 'usuarios':
        return currentUserRole === 'ADMIN' ? <UsersDashboard currentUserId={user.id} /> : null
      default:
        return <AppointmentsDashboard onAddAppointment={(date) => onAddAppointment(format(date, 'yyyy-MM-dd'))} />
    }
  }

  return (
    <div className="mx-auto h-full max-w-[1600px]">
      {renderContent()}
    </div>
  )
}
