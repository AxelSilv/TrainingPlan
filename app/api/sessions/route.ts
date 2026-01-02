import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      date, 
      type, 
      title, 
      plannedNotes, 
      plannedRpe,
      plannedDuration,
      status,
      runDetails,
      swimDetails,
      strengthExercises
    } = body

    // Find or create day plan
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    let dayPlan = await prisma.dayPlan.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    if (!dayPlan) {
      dayPlan = await prisma.dayPlan.create({
        data: {
          date: dayStart,
        },
      })
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        dayPlanId: dayPlan.id,
        type,
        title,
        status: status || 'planned',
        plannedNotes,
        plannedRpe,
        plannedDuration,
      },
    })

    // Create run details if provided
    if (runDetails && type === 'run') {
      await prisma.runDetails.create({
        data: {
          sessionId: session.id,
          plannedKm: runDetails.plannedKm,
          elevationGain: runDetails.elevationGain,
          surface: runDetails.surface,
        },
      })
    }

    // Create swim details if provided
    if (swimDetails && type === 'swim') {
      await prisma.swimDetails.create({
        data: {
          sessionId: session.id,
          plannedMeters: swimDetails.plannedMeters,
          sets: swimDetails.sets,
        },
      })
    }

    // Create strength exercises if provided
    if (strengthExercises && Array.isArray(strengthExercises) && type === 'strength') {
      for (let i = 0; i < strengthExercises.length; i++) {
        const ex = strengthExercises[i]
        if (ex.name) {
          await prisma.strengthExercise.create({
            data: {
              sessionId: session.id,
              name: ex.name,
              sets: ex.sets ?? null,
              reps: ex.reps ?? null,
              load: ex.load ?? null,
              restTime: ex.restTime ?? null,
              tempo: ex.tempo ?? null,
              rpe: ex.rpe ?? null,
              notes: ex.notes ?? null,
              order: i,
            },
          })
        }
      }
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

