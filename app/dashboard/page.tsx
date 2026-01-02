import { Navigation, TopBar } from '@/components/navigation'
import { DashboardClient } from './dashboard-client'
import { prisma } from '@/lib/prisma'
import { subWeeks, startOfWeek, endOfWeek } from 'date-fns'

async function getDashboardData() {
  const now = new Date()
  const fourWeeksAgo = subWeeks(now, 4)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Get all sessions from last 4 weeks
  const sessions = await prisma.session.findMany({
    where: {
      dayPlan: {
        date: {
          gte: fourWeeksAgo,
        },
      },
    },
    include: {
      dayPlan: true,
      runDetails: true,
      strengthExercises: {
        where: {
          load: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      dayPlan: {
        date: 'asc',
      },
    },
  })

  // Get pain logs
  const painLogs = await prisma.painLog.findMany({
    where: {
      date: {
        gte: fourWeeksAgo,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Get weight logs
  const weightLogs = await prisma.weightLog.findMany({
    where: {
      date: {
        gte: fourWeeksAgo,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Calculate weekly running totals
  const weeklyRunTotals: Record<string, number> = {}
  sessions.forEach((session) => {
    if (session.type === 'run' && session.runDetails?.completedKm) {
      const weekKey = startOfWeek(session.dayPlan.date, { weekStartsOn: 1 }).toISOString()
      weeklyRunTotals[weekKey] = (weeklyRunTotals[weekKey] || 0) + session.runDetails.completedKm
    }
  })

  // Calculate adherence
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const totalSessions = sessions.length
  const adherence = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

  // Group exercises by name and track progression
  const exerciseProgression: Record<string, Array<{ date: Date; load: number; sets?: number; reps?: number }>> = {}
  sessions.forEach((session) => {
    if (session.type === 'strength' && session.strengthExercises) {
      session.strengthExercises.forEach((ex) => {
        if (ex.load && ex.name) {
          if (!exerciseProgression[ex.name]) {
            exerciseProgression[ex.name] = []
          }
          exerciseProgression[ex.name].push({
            date: session.dayPlan.date,
            load: ex.load,
            sets: ex.sets ?? undefined,
            reps: ex.reps ?? undefined,
          })
        }
      })
    }
  })

  return {
    sessions,
    painLogs,
    weightLogs,
    weeklyRunTotals,
    adherence,
    exerciseProgression,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navigation />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <DashboardClient initialData={data} />
      </div>
    </div>
  )
}

