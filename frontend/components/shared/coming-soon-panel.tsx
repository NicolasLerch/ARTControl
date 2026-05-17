'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Clock3 } from 'lucide-react'

interface ComingSoonPanelProps {
  title: string
  description: string
}

export function ComingSoonPanel({ title, description }: ComingSoonPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-72px)] items-center justify-center">
        <Empty className="border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clock3 className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Próximamente</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}
