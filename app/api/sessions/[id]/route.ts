import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, getDay } from 'date-fns'
import { requireAuth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user // Unauthorized response
    
    const body = await request.json()
    const { id } = params
    
    // Verify session belongs to user
    const existingSession = await prisma.trainingSession.findFirst({
      where: {
        id,
        dayPlan: {
          userId: user.id,
        },
      },
    })
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      status: body.status,
      completedRpe: body.completedRpe,
      completedDuration: body.completedDuration,
      completedNotes: body.completedNotes,
      kneePainScore: body.kneePainScore,
    }

    // Update run details if provided
    if (body.runDetails) {
      await prisma.runDetails.upsert({
        where: { sessionId: id },
        update: body.runDetails,
        create: {
          sessionId: id,
          ...body.runDetails,
        },
      })
    }

    // Update swim details if provided
    if (body.swimDetails) {
      await prisma.swimDetails.upsert({
        where: { sessionId: id },
        update: body.swimDetails,
        create: {
          sessionId: id,
          ...body.swimDetails,
        },
      })
    }

    // Update strength exercises if provided
    if (body.strengthExercises && Array.isArray(body.strengthExercises)) {
      // Delete existing exercises (cascade will delete sets)
      await prisma.strengthExercise.deleteMany({
        where: { sessionId: id },
      })
      
      // Create new exercises with sets
      for (let i = 0; i < body.strengthExercises.length; i++) {
        const ex = body.strengthExercises[i]
        if (ex.name) { // Only create if name is provided
          const createdExercise = await prisma.strengthExercise.create({
            data: {
              sessionId: id,
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

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: updateData,
      include: {
        dayPlan: true,
        runDetails: true,
      },
    })

    // Handle skipped long run distance carry-over
    if (updated.status === 'skipped' && updated.type === 'run' && updated.runDetails?.plannedKm) {
      const sessionDate = new Date(updated.dayPlan.date)
      const dayOfWeek = getDay(sessionDate) // 0 = Sunday, 3 = Wednesday
      
      // Only handle long runs (Wednesday)
      if (dayOfWeek === 3 && updated.title.includes('Long Run')) {
        const skippedDistance = updated.runDetails.plannedKm
        
        // Find next week's Wednesday (long run day)
        const nextWeekStart = startOfWeek(addWeeks(sessionDate, 1), { weekStartsOn: 1 })
        const nextWednesday = new Date(nextWeekStart)
        nextWednesday.setDate(nextWeekStart.getDate() + 2) // Wednesday is 2 days after Monday
        
        // Find the next week's long run session
        const nextWeekLongRun = await prisma.trainingSession.findFirst({
          where: {
            dayPlan: {
              userId: user.id,
              date: {
                gte: new Date(nextWednesday.getFullYear(), nextWednesday.getMonth(), nextWednesday.getDate()),
                lt: new Date(nextWednesday.getFullYear(), nextWednesday.getMonth(), nextWednesday.getDate() + 1),
              },
            },
            type: 'run',
            title: { contains: 'Long Run' },
          },
          include: {
            runDetails: true,
            dayPlan: true,
          },
        })
        
        if (nextWeekLongRun && nextWeekLongRun.runDetails) {
          // Store the original distance temporarily
          const originalDistance = nextWeekLongRun.runDetails.plannedKm
          
          // Update next week's long run with skipped distance
          await prisma.runDetails.update({
            where: { sessionId: nextWeekLongRun.id },
            data: {
              plannedKm: skippedDistance,
            },
          })
          
          // Update the session title to reflect new distance
          await prisma.trainingSession.update({
            where: { id: nextWeekLongRun.id },
            data: {
              title: `Long Run ${skippedDistance.toFixed(1)} km`,
            },
          })
          
          // Recursively carry over the original distance to the week after
          if (originalDistance) {
            const weekAfterStart = startOfWeek(addWeeks(nextWednesday, 1), { weekStartsOn: 1 })
            const weekAfterWednesday = new Date(weekAfterStart)
            weekAfterWednesday.setDate(weekAfterStart.getDate() + 2)
            
            const weekAfterLongRun = await prisma.trainingSession.findFirst({
              where: {
                dayPlan: {
                  userId: user.id,
                  date: {
                    gte: new Date(weekAfterWednesday.getFullYear(), weekAfterWednesday.getMonth(), weekAfterWednesday.getDate()),
                    lt: new Date(weekAfterWednesday.getFullYear(), weekAfterWednesday.getMonth(), weekAfterWednesday.getDate() + 1),
                  },
                },
                type: 'run',
                title: { contains: 'Long Run' },
              },
              include: {
                runDetails: true,
              },
            })
            
            if (weekAfterLongRun && weekAfterLongRun.runDetails) {
              await prisma.runDetails.update({
                where: { sessionId: weekAfterLongRun.id },
                data: {
                  plannedKm: originalDistance,
                },
              })
              
              await prisma.trainingSession.update({
                where: { id: weekAfterLongRun.id },
                data: {
                  title: `Long Run ${originalDistance.toFixed(1)} km`,
                },
              })
            }
          }
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user // Unauthorized response
    
    const { id } = params

    // Verify session belongs to user before deleting
    const existingSession = await prisma.trainingSession.findFirst({
      where: {
        id,
        dayPlan: {
          userId: user.id,
        },
      },
    })
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete session (cascade will handle related records)
    await prisma.trainingSession.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}

