import { Navigation, TopBar } from '@/components/navigation'
import { WeekSelector } from '@/components/week-selector'
import { DaySection } from '@/components/day-section'
import { CalendarClient } from './calendar-client'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

async function getWeekData(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
  
  const dayPlans = await prisma.dayPlan.findMany({
    where: {
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      sessions: {
        include: {
          runDetails: true,
          swimDetails: true,
          strengthExercises: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Create day plans for all days in week (even if no sessions)
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const dayPlansMap = new Map(dayPlans.map(dp => [dp.date.toISOString().split('T')[0], dp]))
  
  const weekData = allDays.map(day => {
    const key = day.toISOString().split('T')[0]
    const existing = dayPlansMap.get(key)
    if (existing) return existing
    
    return {
      id: `temp-${key}`,
      date: day,
      createdAt: new Date(),
      updatedAt: new Date(),
      sessions: [],
    }
  })

  return weekData
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { today?: string; add?: string }
}) {
  const initialDate = searchParams.today === 'true' ? new Date() : new Date()
  const weekData = await getWeekData(initialDate)

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navigation />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <CalendarClient initialDate={initialDate} initialWeekData={weekData} />
      </div>
    </div>
  )
}

