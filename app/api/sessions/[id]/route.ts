import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

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
              tempo: ex.tempo ?? null,
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
                  notes: set.notes ?? null,
                },
              })
            }
          }
        }
      }
    }

    const updated = await prisma.session.update({
      where: { id },
      data: updateData,
    })

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
    const { id } = params

    // Delete session (cascade will handle related records)
    await prisma.session.delete({
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

