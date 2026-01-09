import { PrismaClient } from '@prisma/client'
import { generatePlan, type PlanSettings } from '../lib/plan-generator'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')
  
  // Clear existing data, but preserve first two weeks of January 2026
  const preserveStartDate = new Date('2026-01-02T00:00:00')
  const preserveEndDate = new Date('2026-01-15T23:59:59')
  
  await prisma.weightLog.deleteMany()
  await prisma.painLog.deleteMany()
  
  // Only delete sessions outside preserved period
  const sessionsToDelete = await prisma.trainingSession.findMany({
    where: {
      dayPlan: {
        date: {
          not: {
            gte: preserveStartDate,
            lte: preserveEndDate,
          },
        },
      },
    },
    include: {
      dayPlan: true,
    },
  })
  
  const sessionIdsToDelete = sessionsToDelete.map(s => s.id)
  
  if (sessionIdsToDelete.length > 0) {
    await prisma.exerciseSet.deleteMany({
      where: {
        strengthExercise: {
          sessionId: { in: sessionIdsToDelete },
        },
      },
    })
    await prisma.strengthExercise.deleteMany({
      where: {
        sessionId: { in: sessionIdsToDelete },
      },
    })
    await prisma.swimDetails.deleteMany({
      where: {
        sessionId: { in: sessionIdsToDelete },
      },
    })
    await prisma.runDetails.deleteMany({
      where: {
        sessionId: { in: sessionIdsToDelete },
      },
    })
    await prisma.trainingSession.deleteMany({
      where: {
        id: { in: sessionIdsToDelete },
      },
    })
  }
  
  // Delete day plans outside preserved period
  await prisma.dayPlan.deleteMany({
    where: {
      date: {
        not: {
          gte: preserveStartDate,
          lte: preserveEndDate,
        },
      },
    },
  })
  
  await prisma.userSettings.deleteMany()
  
  console.log('✅ Cleared existing data (preserved Jan 2-15, 2026)')
  
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
  // Preserve first two weeks of January 2026 (Jan 2-15) - user has already edited these
  const preserveStartDate2 = new Date('2026-01-02T00:00:00')
  const preserveEndDate2 = new Date('2026-01-15T23:59:59')
  
  for (const day of generatedPlan) {
    // Normalize date to start of day to avoid timezone issues
    const normalizedDate = new Date(day.date)
    normalizedDate.setHours(0, 0, 0, 0)
    
    // Skip if this date is in the first two weeks of January 2026
    const isPreservedDate = normalizedDate >= preserveStartDate2 && normalizedDate <= preserveEndDate2
    
    // Check if day plan already exists
    let dayPlan = await prisma.dayPlan.findUnique({
      where: { date: normalizedDate }
    })
    
    if (!dayPlan) {
      dayPlan = await prisma.dayPlan.create({
        data: { date: normalizedDate }
      })
    } else if (isPreservedDate) {
      // If date is preserved and dayPlan exists, skip creating sessions
      console.log(`⏭️  Preserving existing sessions for ${normalizedDate.toISOString().split('T')[0]}`)
      continue
    }
    
    // Get existing sessions for this day
    const existingSessions = await prisma.trainingSession.findMany({
      where: { dayPlanId: dayPlan.id },
      include: {
        runDetails: true,
        swimDetails: true,
        strengthExercises: {
          include: { sets: true }
        }
      }
    })
    
    // Create a set of seed-generated session identifiers (type + title)
    const seedSessionKeys = new Set<string>()
    for (const session of day.sessions) {
      seedSessionKeys.add(`${session.type}:${session.title}`)
    }
    
    // Check which sessions should be preserved:
    // 1. User-added sessions (not in seed plan)
    // 2. User-modified sessions (have completed data, status changed, etc.)
    const sessionsToPreserve = new Set<string>()
    for (const existingSession of existingSessions) {
      const sessionKey = `${existingSession.type}:${existingSession.title}`
      const isSeedSession = seedSessionKeys.has(sessionKey)
      const isUserAdded = !isSeedSession
      
      // Check if session has user modifications
      const hasUserModifications = 
        existingSession.status !== 'planned' ||
        existingSession.completedRpe !== null ||
        existingSession.completedDuration !== null ||
        existingSession.completedNotes !== null ||
        existingSession.completedNotes !== '' ||
        existingSession.kneePainScore !== null ||
        (existingSession.runDetails && existingSession.runDetails.completedKm !== null) ||
        (existingSession.swimDetails && existingSession.swimDetails.completedMeters !== null) ||
        (existingSession.strengthExercises && existingSession.strengthExercises.some(ex => 
          ex.sets && ex.sets.some(set => 
            set.load !== null || set.reps !== null || set.rpe !== null || set.notes !== null
          )
        ))
      
      if (isUserAdded) {
        // Always preserve user-added sessions
        sessionsToPreserve.add(existingSession.id)
        console.log(`💾 Preserving user-added session: ${existingSession.title} (${normalizedDate.toISOString().split('T')[0]})`)
      } else if (hasUserModifications) {
        // Preserve seed sessions that have been modified by user
        sessionsToPreserve.add(existingSession.id)
        console.log(`💾 Preserving user-modified seed session: ${existingSession.title} (${normalizedDate.toISOString().split('T')[0]})`)
      }
    }
    
    // Delete only seed sessions that don't have user modifications and are not user-added
    const sessionsToDelete = existingSessions.filter(s => !sessionsToPreserve.has(s.id))
    const sessionIdsToDelete = sessionsToDelete.map(s => s.id)
    
    if (sessionIdsToDelete.length > 0) {
      await prisma.exerciseSet.deleteMany({
        where: {
          strengthExercise: {
            sessionId: { in: sessionIdsToDelete }
          }
        }
      })
      await prisma.strengthExercise.deleteMany({
        where: {
          sessionId: { in: sessionIdsToDelete }
        }
      })
      await prisma.runDetails.deleteMany({
        where: {
          sessionId: { in: sessionIdsToDelete }
        }
      })
      await prisma.swimDetails.deleteMany({
        where: {
          sessionId: { in: sessionIdsToDelete }
        }
      })
        await prisma.trainingSession.deleteMany({
          where: { id: { in: sessionIdsToDelete } }
        })
      console.log(`🗑️  Deleted ${sessionIdsToDelete.length} unmodified sessions for ${normalizedDate.toISOString().split('T')[0]}`)
    }
    
    // Create new sessions from generated plan
    for (const session of day.sessions) {
      // Check if a similar session already exists (same type and title)
      const similarSession = existingSessions.find(s => 
        s.type === session.type && 
        s.title === session.title &&
        sessionsToPreserve.has(s.id)
      )
      
      if (similarSession) {
        // Update only planned fields, preserve completed fields
          await prisma.trainingSession.update({
            where: { id: similarSession.id },
          data: {
            plannedRpe: session.plannedRpe,
            plannedDuration: session.plannedDuration,
            plannedNotes: session.plannedNotes,
            // Don't update status, completed fields, etc.
          }
        })
        console.log(`🔄 Updated planned fields for existing session: ${session.title}`)
        continue
      }
      
      const createdSession = await prisma.trainingSession.create({
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
        // Check if run details already exist (from user-modified session)
        const existingRunDetails = await prisma.runDetails.findUnique({
          where: { sessionId: createdSession.id }
        })
        
        if (!existingRunDetails) {
          await prisma.runDetails.create({
            data: {
              sessionId: createdSession.id,
              plannedKm: session.runDetails.plannedKm,
              elevationGain: session.runDetails.elevationGain,
              surface: session.runDetails.surface
            }
          })
        } else {
          // Update only planned fields, preserve completed fields
          await prisma.runDetails.update({
            where: { sessionId: createdSession.id },
            data: {
              plannedKm: session.runDetails.plannedKm,
              elevationGain: session.runDetails.elevationGain,
              surface: session.runDetails.surface
              // Don't update completedKm
            }
          })
        }
      }
      
      // Create swim details if applicable
      if (session.type === 'swim' && session.swimDetails) {
        const existingSwimDetails = await prisma.swimDetails.findUnique({
          where: { sessionId: createdSession.id }
        })
        
        if (!existingSwimDetails) {
          await prisma.swimDetails.create({
            data: {
              sessionId: createdSession.id,
              plannedMeters: session.swimDetails.plannedMeters,
              sets: session.swimDetails.sets
            }
          })
        } else {
          // Update only planned fields, preserve completed fields
          await prisma.swimDetails.update({
            where: { sessionId: createdSession.id },
            data: {
              plannedMeters: session.swimDetails.plannedMeters,
              sets: session.swimDetails.sets
              // Don't update completedMeters
            }
          })
        }
      }
      
      // Create strength exercises if applicable
      if (session.type === 'strength' && session.strengthExercises) {
        // Get existing exercises for this session
        const existingExercises = await prisma.strengthExercise.findMany({
          where: { sessionId: createdSession.id },
          include: { sets: true }
        })
        
        for (let i = 0; i < session.strengthExercises.length; i++) {
          const ex = session.strengthExercises[i]
          
          // Check if exercise already exists (by name)
          const existingExercise = existingExercises.find(e => e.name === ex.name)
          
          let exerciseId: string
          if (existingExercise) {
            // Update existing exercise (only planned fields)
            await prisma.strengthExercise.update({
              where: { id: existingExercise.id },
              data: {
                restTime: ex.restTime,
                notes: ex.notes,
                order: i
              }
            })
            exerciseId = existingExercise.id
            
            // Check if sets have user modifications (load, reps, rpe, notes)
            const userModifiedSetIds = new Set<string>()
            for (const existingSet of existingExercise.sets) {
              if (existingSet.load !== null || existingSet.reps !== null || existingSet.rpe !== null || existingSet.notes !== null) {
                userModifiedSetIds.add(existingSet.id)
              }
            }
            
            // Delete sets that don't have user modifications
            const setsToDelete = existingExercise.sets.filter(s => !userModifiedSetIds.has(s.id))
            if (setsToDelete.length > 0) {
              await prisma.exerciseSet.deleteMany({
                where: {
                  id: { in: setsToDelete.map(s => s.id) }
                }
              })
            }
            
            // Add new sets or update existing ones
            if (ex.sets && Array.isArray(ex.sets)) {
              for (const set of ex.sets) {
                const existingSet = existingExercise.sets.find(s => s.setNumber === set.setNumber && userModifiedSetIds.has(s.id))
                
                if (existingSet) {
                  // Skip updating user-modified sets (preserve user data)
                  continue
                } else {
                  // Create new set
                  await prisma.exerciseSet.create({
                    data: {
                      strengthExerciseId: exerciseId,
                      setNumber: set.setNumber,
                      reps: set.reps,
                      load: set.load,
                      rpe: set.rpe,
                      isDropSet: set.isDropSet ?? false,
                      notes: set.notes
                    }
                  })
                }
              }
            }
          } else {
            // Create new exercise
            const createdExercise = await prisma.strengthExercise.create({
              data: {
                sessionId: createdSession.id,
                name: ex.name,
                restTime: ex.restTime,
                notes: ex.notes,
                order: i
              }
            })
            exerciseId = createdExercise.id
            
            // Create sets for this exercise
            if (ex.sets && Array.isArray(ex.sets)) {
              for (const set of ex.sets) {
                await prisma.exerciseSet.create({
                  data: {
                    strengthExerciseId: exerciseId,
                    setNumber: set.setNumber,
                    reps: set.reps,
                    load: set.load,
                    rpe: set.rpe,
                    isDropSet: set.isDropSet ?? false,
                    notes: set.notes
                  }
                })
              }
            }
          }
        }
      }
    }
  }
  
  // Mark Jan 2, 2026 Leg Day 1 as completed
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
      await prisma.trainingSession.update({
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
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
