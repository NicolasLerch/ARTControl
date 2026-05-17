'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, UserCheck, Pill, Building2, Stethoscope } from 'lucide-react'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { value: 'turnos', label: 'Turnos', icon: CalendarDays },
  { value: 'pacientes', label: 'Pacientes', icon: Users },
  { value: 'atendidos', label: 'Atendidos hoy', icon: UserCheck },
  { value: 'vademecum', label: 'Vademécum', icon: Pill },
  { value: 'farmacias', label: 'Farmacias', icon: Building2 },
  { value: 'especialistas', label: 'Especialistas', icon: Stethoscope },
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="h-12 w-full justify-start gap-1 rounded-none border-none bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
