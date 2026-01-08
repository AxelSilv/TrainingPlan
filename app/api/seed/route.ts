import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generatePlan, type PlanSettings } from '@/lib/plan-generator'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Security: Only allow in development or with a secret key
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.SEED_SECRET_KEY || 'dev-secret-key'
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🌱 Starting seed...')
    
    // Clear existing data
    await prisma.weightLog.deleteMany()
    await prisma.painLog.deleteMany()
    await prisma.swimDetails.deleteMany()
    await prisma.runDetails.deleteMany()
    await prisma.exerciseSet.deleteMany()
    await prisma.strengthExercise.deleteMany()
    await prisma.session.deleteMany()
    await prisma.dayPlan.deleteMany()
    await prisma.userSettings.deleteMany()
    
    console.log('✅ Cleared existing data')
    
    // Create user settings
    const settings = await prisma.userSettings.create({
      data: {
        id: 'singleton',
        timezone: 'Europe/Helsinki',
        sex: 'male',
        heightCm: 183,
        weightKg: 89.0,
        goalWeightKg: 80.0,
        runFrequency: 3,
        swimFrequency: 1,
        strengthFrequency: 3,
        restDay: 'saturday'
      }
    })
    
    console.log('✅ Created user settings')
    
    // Generate plan
    const startDate = new Date('2026-01-02T00:00:00')
    const endDate = new Date('2026-07-20T23:59:59')
    
    const planSettings: PlanSettings = {
      startDate,
      endDate,
      timezone: 'Europe/Helsinki',
      runFrequency: settings.runFrequency,
      swimFrequency: settings.swimFrequency,
      strengthFrequency: settings.strengthFrequency,
      heightCm: settings.heightCm,
      weightKg: settings.weightKg,
      goalWeightKg: settings.goalWeightKg
    }
    
    const generatedPlan = generatePlan(planSettings)
    
    console.log(`📅 Generated ${generatedPlan.length} days of training plan`)
    
    // Create day plans and sessions
    // Use upsert to avoid duplicates if seed is run multiple times
    for (const day of generatedPlan) {
      // Normalize date to start of day to avoid timezone issues
      const normalizedDate = new Date(day.date)
      normalizedDate.setHours(0, 0, 0, 0)
      
      // Check if day plan already exists
      let dayPlan = await prisma.dayPlan.findUnique({
        where: { date: normalizedDate }
      })
      
      if (!dayPlan) {
        dayPlan = await prisma.dayPlan.create({
          data: { date: normalizedDate }
        })
      } else {
        // Delete existing sessions for this day to avoid duplicates
        await prisma.exerciseSet.deleteMany({
          where: {
            strengthExercise: {
              session: {
                dayPlanId: dayPlan.id
              }
            }
          }
        })
        await prisma.strengthExercise.deleteMany({
          where: {
            session: {
              dayPlanId: dayPlan.id
            }
          }
        })
        await prisma.runDetails.deleteMany({
          where: {
            session: {
              dayPlanId: dayPlan.id
            }
          }
        })
        await prisma.swimDetails.deleteMany({
          where: {
            session: {
              dayPlanId: dayPlan.id
            }
          }
        })
        await prisma.session.deleteMany({
          where: { dayPlanId: dayPlan.id }
        })
      }
      
      for (const session of day.sessions) {
        const createdSession = await prisma.session.create({
          data: {
            dayPlanId: dayPlan.id,
            type: session.type,
            title: session.title,
            status: 'planned',
            plannedRpe: session.plannedRpe,
            plannedDuration: session.plannedDuration,
            plannedNotes: session.plannedNotes
          }
        })
        
        // Create run details if applicable
        if (session.type === 'run' && session.runDetails) {
          await prisma.runDetails.create({
            data: {
              sessionId: createdSession.id,
              plannedKm: session.runDetails.plannedKm,
              elevationGain: session.runDetails.elevationGain,
              surface: session.runDetails.surface
            }
          })
        }
        
        // Create swim details if applicable
        if (session.type === 'swim' && session.swimDetails) {
          await prisma.swimDetails.create({
            data: {
              sessionId: createdSession.id,
              plannedMeters: session.swimDetails.plannedMeters,
              sets: session.swimDetails.sets
            }
          })
        }
        
        // Create strength exercises if applicable
        if (session.type === 'strength' && session.strengthExercises) {
          for (let i = 0; i < session.strengthExercises.length; i++) {
            const ex = session.strengthExercises[i]
            const createdExercise = await prisma.strengthExercise.create({
              data: {
                sessionId: createdSession.id,
                name: ex.name,
                restTime: ex.restTime,
                order: i
              }
            })
            
            // Create sets for this exercise
            if (ex.sets && Array.isArray(ex.sets)) {
              for (const set of ex.sets) {
                await prisma.exerciseSet.create({
                  data: {
                    strengthExerciseId: createdExercise.id,
                    setNumber: set.setNumber,
                    reps: set.reps,
                    load: set.load,
                    rpe: set.rpe,
                  }
                })
              }
            }
          }
        }
      }
    }
    
    // Mark Jan 2, 2026 strength session as completed
    const jan2 = new Date('2026-01-02T00:00:00')
    const jan2DayPlan = await prisma.dayPlan.findFirst({
      where: {
        date: {
          gte: new Date(jan2.getFullYear(), jan2.getMonth(), jan2.getDate()),
          lt: new Date(jan2.getFullYear(), jan2.getMonth(), jan2.getDate() + 1)
        }
      },
      include: { sessions: true }
    })
    
    if (jan2DayPlan) {
      // Jan 2, 2026 is a Monday - should be "Leg Day 1 - Quadriceps Focus"
      const legDay1 = jan2DayPlan.sessions.find(s => s.title.includes('Leg Day 1 - Quadriceps Focus'))
      if (legDay1) {
        await prisma.session.update({
          where: { id: legDay1.id },
          data: {
            status: 'completed',
            completedNotes: 'Done - First workout completed!'
          }
        })
        console.log('✅ Marked Jan 2 Leg Day 1 as completed')
      }
    }
    
    console.log('✅ Seed completed successfully!')
    
    return NextResponse.json({ 
      success: true,
      message: `Seed completed! Created ${generatedPlan.length} days of training plan.`
    })
  } catch (error) {
    console.error('❌ Seed failed:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

