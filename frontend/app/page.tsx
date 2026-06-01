'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

import { CreateAppointmentModal } from '@/components/appointments/create-appointment-modal'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { Header } from '@/components/layout/header'
import { Navigation } from '@/components/layout/navigation'
import { logout } from '@/lib/api/client'
import { useAuthSession } from '@/lib/hooks/use-auth-session'

export default function HomePage() {
  const router = useRouter()
  const { user, loading, setUser } = useAuthSession(true)
  const [activeTab, setActiveTab] = useState('turnos')
  const [showAddAppointment, setShowAddAppointment] = useState(false)
  const [appointmentDefaultDate, setAppointmentDefaultDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const handleLogout = async () => {
    await logout()
    startTransition(() => {
      setUser(null)
      router.replace('/login')
    })
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando sesion...</p>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} userRole={user.role} />

      <main className="flex-1 overflow-hidden p-6">
        <DashboardContent
          activeTab={activeTab}
          user={user}
          onAddAppointment={(date) => {
            setAppointmentDefaultDate(date)
            setShowAddAppointment(true)
          }}
        />
      </main>

      <CreateAppointmentModal
        open={showAddAppointment}
        onOpenChange={setShowAddAppointment}
        initialDate={appointmentDefaultDate}
      />
    </div>
  )
}
