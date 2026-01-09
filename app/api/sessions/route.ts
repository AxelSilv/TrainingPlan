import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user // Unauthorized response
    
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
        userId: user.id,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    if (!dayPlan) {
      dayPlan = await prisma.dayPlan.create({
        data: {
          userId: user.id,
          date: dayStart,
        },
      })
    }

    // Create session
    const session = await prisma.trainingSession.create({
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
          const createdExercise = await prisma.strengthExercise.create({
            data: {
              sessionId: session.id,
              name: ex.name,
              restTime: ex.restTime ?? null,
              notes: ex.notes ?? null,
              order: i,
            },
          })
          
          // Create sets for this exercise
          if (ex.sets && Array.isArray(ex.sets)) {
            for (const set of ex.sets) {
              await prisma.exerciseSet.create({
                data: {
                  strengthExerciseId: createdExercise.id,
                  setNumber: set.setNumber,
                  reps: set.reps ?? null,
                  load: set.load ?? null,
                  rpe: set.rpe ?? null,
                  isDropSet: set.isDropSet ?? false,
                  notes: set.notes ?? null,
                },
              })
            }
          }
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

