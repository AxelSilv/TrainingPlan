'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, isSameWeek } from 'date-fns'
import { cn } from '@/lib/utils'

interface WeekSelectorProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function WeekSelector({ currentDate, onDateChange }: WeekSelectorProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const goToPreviousWeek = () => {
    onDateChange(subWeeks(currentDate, 1))
  }

  const goToNextWeek = () => {
    onDateChange(addWeeks(currentDate, 1))
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const isCurrentWeek = isSameWeek(new Date(), currentDate, { weekStartsOn: 1 })

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background sticky top-14 z-30">
      <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex flex-col items-center flex-1">
        <div className="text-sm font-medium">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className={cn("text-xs mt-1", isCurrentWeek && "text-primary")}
        >
          {isCurrentWeek ? 'This Week' : 'Go to Today'}
        </Button>
      </div>

      <Button variant="ghost" size="icon" onClick={goToNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

