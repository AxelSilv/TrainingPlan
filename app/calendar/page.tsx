import { Navigation, TopBar } from '@/components/navigation'
import { WeekSelector } from '@/components/week-selector'
import { DaySection } from '@/components/day-section'
import { CalendarClient } from './calendar-client'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getWeekData(date: Date, userId: string) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
  
  const dayPlans = await prisma.dayPlan.findMany({
    where: {
      userId,
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
            include: {
              sets: {
                orderBy: { setNumber: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Normalize dates to start of day for comparison
  const normalizeDate = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }
  
  // Remove duplicates - keep only the first occurrence of each date
  const uniqueDayPlans = new Map<string, typeof dayPlans[0]>()
  for (const dp of dayPlans) {
    const key = normalizeDate(dp.date)
    if (!uniqueDayPlans.has(key)) {
      uniqueDayPlans.set(key, dp)
    } else {
      // If duplicate found, merge sessions (keep all sessions from both)
      const existing = uniqueDayPlans.get(key)!
      existing.sessions = [...existing.sessions, ...dp.sessions]
    }
  }
  
  // Create day plans for all days in week (even if no sessions)
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  const weekData = allDays.map(day => {
    const key = normalizeDate(day)
    const existing = uniqueDayPlans.get(key)
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
  const user = await getCurrentUser()
  if (!user?.id) {
    redirect('/auth/signin')
  }
  
  const initialDate = searchParams.today === 'true' ? new Date() : new Date()
  const weekData = await getWeekData(initialDate, user.id)

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

