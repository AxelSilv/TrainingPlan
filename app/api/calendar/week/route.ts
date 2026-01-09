import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user // Unauthorized response
    
    const searchParams = request.nextUrl.searchParams
    const weekStart = searchParams.get('weekStart')
    const weekEnd = searchParams.get('weekEnd')

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'Missing weekStart or weekEnd' },
        { status: 400 }
      )
    }

    const start = new Date(weekStart)
    const end = new Date(weekEnd)

    const dayPlans = await prisma.dayPlan.findMany({
      where: {
        userId: user.id,
        date: {
          gte: start,
          lte: end,
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
    const allDays = eachDayOfInterval({ start, end })
    
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

    return NextResponse.json(weekData)
  } catch (error) {
    console.error('Error fetching week data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week data' },
      { status: 500 }
    )
  }
}

