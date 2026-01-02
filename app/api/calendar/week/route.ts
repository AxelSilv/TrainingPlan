import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Create day plans for all days in week (even if no sessions)
    const allDays = eachDayOfInterval({ start, end })
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

    return NextResponse.json(weekData)
  } catch (error) {
    console.error('Error fetching week data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week data' },
      { status: 500 }
    )
  }
}

