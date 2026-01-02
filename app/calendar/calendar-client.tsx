'use client'

import { useState, useEffect } from 'react'
import { WeekSelector } from '@/components/week-selector'
import { DaySection } from '@/components/day-section'
import { SessionEditor } from '@/components/session-editor'
import { AddSessionDialog } from '@/components/add-session-dialog'
import { useRouter } from 'next/navigation'
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import type { Session, DayPlan } from '@prisma/client'

interface CalendarClientProps {
  initialDate: Date
  initialWeekData: (DayPlan & {
    sessions: (Session & {
      runDetails?: { plannedKm?: number | null; completedKm?: number | null } | null
      swimDetails?: { plannedMeters?: number | null; completedMeters?: number | null } | null
      strengthExercises?: Array<{ name: string }>
    })[]
  })[]
}

export function CalendarClient({ initialDate, initialWeekData }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [weekData, setWeekData] = useState(initialWeekData)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Refresh data when week changes
    fetchWeekData(currentDate)
  }, [currentDate])

  const fetchWeekData = async (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    
    const params = new URLSearchParams({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    })
    
    const res = await fetch(`/api/calendar/week?${params}`)
    if (res.ok) {
      const data = await res.json()
      setWeekData(data)
    }
  }

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    setIsEditorOpen(true)
  }

  const handleSessionUpdate = () => {
    fetchWeekData(currentDate)
    setIsEditorOpen(false)
    setSelectedSession(null)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setSelectedSession(null)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDay(date)
    setIsAddDialogOpen(true) // Open dialog automatically when day is selected
  }

  const handleAddSession = async (data: {
    type: string
    title: string
    plannedRpe?: number
    plannedDuration?: number
    plannedNotes?: string
    runDetails?: { plannedKm?: number; elevationGain?: number; surface?: string }
    swimDetails?: { plannedMeters?: number; sets?: string }
    strengthExercises?: Array<{
      name: string
      sets?: number
      reps?: number
      load?: number
      restTime?: number
      tempo?: string
      rpe?: number
      notes?: string
    }>
  }) => {
    if (!selectedDay) {
      alert('Valitse ensin päivä kalenterista')
      return
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDay.toISOString(),
          type: data.type,
          title: data.title,
          plannedRpe: data.plannedRpe,
          plannedDuration: data.plannedDuration,
          plannedNotes: data.plannedNotes,
          status: 'planned',
          runDetails: data.runDetails,
          swimDetails: data.swimDetails,
          strengthExercises: data.strengthExercises,
        }),
      })

      if (!res.ok) throw new Error('Failed to create session')

      await fetchWeekData(currentDate)
      setSelectedDay(null)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Treenin lisääminen epäonnistui')
    }
  }

  useEffect(() => {
    // Check if add dialog should be open from URL (for Add button)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('add') === 'true') {
        // If no day is selected, just open dialog (user needs to select day)
        if (!selectedDay) {
          setIsAddDialogOpen(true)
        }
        // Clean up URL
        router.replace('/calendar')
      }
    }
  }, [router, selectedDay])

  return (
    <>
      <WeekSelector currentDate={currentDate} onDateChange={setCurrentDate} />
      <div className="flex-1 overflow-y-auto">
        {weekData.map((dayPlan) => (
          <DaySection
            key={dayPlan.id}
            dayPlan={dayPlan}
            onSessionClick={handleSessionClick}
            onDayClick={handleDayClick}
            isSelected={selectedDay ? isSameDay(new Date(dayPlan.date), selectedDay) : false}
          />
        ))}
      </div>
      
      {isEditorOpen && selectedSession && (
        <SessionEditor
          session={selectedSession}
          open={isEditorOpen}
          onClose={handleCloseEditor}
          onUpdate={handleSessionUpdate}
        />
      )}

      <AddSessionDialog
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setSelectedDay(null)
        }}
        selectedDate={selectedDay}
        existingSessionsCount={selectedDay ? weekData.find(d => isSameDay(new Date(d.date), selectedDay))?.sessions.length || 0 : 0}
        onAdd={handleAddSession}
      />
    </>
  )
}

