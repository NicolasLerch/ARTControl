'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Navigation } from '@/components/layout/navigation'
import { AppointmentsDashboard } from '@/components/appointments/appointments-dashboard'
import { CreateAppointmentModal } from '@/components/appointments/create-appointment-modal'
import { PatientsList } from '@/components/patients/patients-list'
import { AttendedToday } from '@/components/attended/attended-today'
import { ComingSoonPanel } from '@/components/shared/coming-soon-panel'
import { Vademecum } from '@/components/vademecum/vademecum'
import { TwoFactorSetupCard } from '@/components/auth/two-factor-setup-card'
import { useAuthSession } from '@/lib/hooks/use-auth-session'
import { logout } from '@/lib/api/client'
import { format } from 'date-fns'

export default function HomePage() {
  const router = useRouter()
  const { user, loading, setUser } = useAuthSession(true)
  const [activeTab, setActiveTab] = useState('turnos')
  const [showAddAppointment, setShowAddAppointment] = useState(false)
  const [appointmentDefaultDate, setAppointmentDefaultDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const currentUserRole = user?.role ?? 'USER'

  const handleLogout = async () => {
    await logout()
    startTransition(() => {
      setUser(null)
      router.replace('/login')
    })
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'turnos':
        return <AppointmentsDashboard onAddAppointment={(date) => {
          setAppointmentDefaultDate(format(date, 'yyyy-MM-dd'))
          setShowAddAppointment(true)
        }} />
      case 'pacientes':
        return <PatientsList onAddAppointment={() => {
          setAppointmentDefaultDate(format(new Date(), 'yyyy-MM-dd'))
          setShowAddAppointment(true)
        }} />
      case 'atendidos':
        return <AttendedToday />
      case 'vademecum':
        return <Vademecum userRole={currentUserRole} />
      case 'farmacias':
        return <ComingSoonPanel title="Farmacias" description="La integración operativa de farmacias queda fuera del MVP y se retomará más adelante." />
      case 'especialistas':
        return <ComingSoonPanel title="Horarios especialistas" description="La agenda de especialistas queda marcada como próxima funcionalidad." />
      default:
        return <AppointmentsDashboard onAddAppointment={(date) => {
          setAppointmentDefaultDate(format(date, 'yyyy-MM-dd'))
          setShowAddAppointment(true)
        }} />
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando sesión...</p>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden p-6">
        <div className="mx-auto h-full max-w-[1600px]">
          <TwoFactorSetupCard user={user} onEnabled={setUser} />
          {renderContent()}
        </div>
      </main>

      <CreateAppointmentModal
        open={showAddAppointment}
        onOpenChange={setShowAddAppointment}
        initialDate={appointmentDefaultDate}
      />
    </div>
  )
}
