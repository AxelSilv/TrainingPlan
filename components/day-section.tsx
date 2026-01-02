'use client'

import { format, isToday, isSameDay } from 'date-fns'
import { SessionCard } from './session-card'
import { cn } from '@/lib/utils'
import type { Session, DayPlan } from '@prisma/client'

interface DaySectionProps {
  dayPlan: DayPlan & {
    sessions: (Session & {
      runDetails?: { plannedKm?: number | null; completedKm?: number | null } | null
      swimDetails?: { plannedMeters?: number | null; completedMeters?: number | null } | null
      strengthExercises?: Array<{ name: string }>
    })[]
  }
  onSessionClick: (session: Session) => void
  onDayClick?: (date: Date) => void
  isSelected?: boolean
}

export function DaySection({ dayPlan, onSessionClick, onDayClick, isSelected }: DaySectionProps) {
  const date = new Date(dayPlan.date)
  const isTodayDate = isToday(date)
  const dayName = format(date, 'EEEE')
  const dayNumber = format(date, 'd')

  return (
    <div 
      className={cn(
        "border-b last:border-b-0 cursor-pointer transition-colors",
        isTodayDate && "bg-accent/30",
        isSelected && "bg-primary/10 border-primary/20"
      )}
      onClick={() => onDayClick?.(date)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className={cn("text-sm font-medium", isTodayDate && "text-primary font-semibold")}>
              {dayName}
            </h3>
            <p className={cn("text-xs text-muted-foreground", isTodayDate && "text-primary")}>
              {format(date, 'MMM d')}
            </p>
          </div>
          {isTodayDate && (
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
              Today
            </span>
          )}
        </div>

        {dayPlan.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No sessions planned</p>
        ) : (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {dayPlan.sessions.map((session) => (
              <div key={session.id} data-session-card>
                <SessionCard
                  session={session}
                  onClick={() => onSessionClick(session)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

