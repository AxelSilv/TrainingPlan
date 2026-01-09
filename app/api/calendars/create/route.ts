import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generatePlan, type PlanSettings } from '@/lib/plan-generator'
import { parse } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user // Unauthorized response

    const body = await request.json()
    const { name, goals, activities, frequency, startDate, endDate } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Parse dates (handle various formats)
    let parsedStartDate: Date
    let parsedEndDate: Date
    
    try {
      // Try common date formats
      const dateFormats = [
        'dd.MM.yyyy', 
        'dd/MM/yyyy', 
        'yyyy-MM-dd', 
        'dd.MM.yy', 
        'dd/MM/yy',
        'd.M.yyyy',
        'd/M/yyyy',
      ]
      
      // Try to parse start date
      let startParsed = false
      for (const format of dateFormats) {
        try {
          parsedStartDate = parse(startDate, format, new Date())
          startParsed = true
          break
        } catch {
          continue
        }
      }
      if (!startParsed) {
        parsedStartDate = new Date(startDate)
      }
      
      // Try to parse end date
      let endParsed = false
      for (const format of dateFormats) {
        try {
          parsedEndDate = parse(endDate, format, new Date())
          endParsed = true
          break
        } catch {
          continue
        }
      }
      if (!endParsed) {
        parsedEndDate = new Date(endDate)
      }
    } catch {
      // Fallback to Date constructor
      parsedStartDate = new Date(startDate)
      parsedEndDate = new Date(endDate)
    }
    
    // Validate dates
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Please use format like dd.MM.yyyy (e.g., 01.01.2026)' },
        { status: 400 }
      )
    }
    
    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Normalize dates to start of day
    parsedStartDate.setHours(0, 0, 0, 0)
    parsedEndDate.setHours(23, 59, 59, 999)

    // Deactivate other calendars for this user
    await prisma.calendar.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Get user settings for defaults
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    })

    // Create calendar
    const calendar = await prisma.calendar.create({
      data: {
        userId: user.id,
        name,
        description: goals?.length > 0 ? `Goals: ${goals.join(', ')}` : null,
        isActive: true,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        goals: JSON.stringify(goals || []),
        activities: JSON.stringify(activities || []),
        frequency: JSON.stringify({ timesPerWeek: frequency || 3 }),
      },
    })

    // Determine training frequencies based on activities and user input
    const activityList = activities || []
    const runFrequency = activityList.includes('run') ? (frequency ? parseInt(frequency) : 3) : 0
    const swimFrequency = activityList.includes('swim') ? (frequency ? Math.floor(parseInt(frequency) / 2) : 1) : 0
    const strengthFrequency = activityList.includes('strength') ? (frequency ? parseInt(frequency) : 3) : 0

    // Generate training plan
    const planSettings: PlanSettings = {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      timezone: userSettings?.timezone || 'Europe/Helsinki',
      runFrequency: runFrequency || 0,
      swimFrequency: swimFrequency || 0,
      strengthFrequency: strengthFrequency || 0,
      heightCm: userSettings?.heightCm || 183,
      weightKg: userSettings?.weightKg || 89.0,
      goalWeightKg: userSettings?.goalWeightKg || 80.0,
    }

    const generatedPlan = generatePlan(planSettings)

    // Create day plans and sessions for this calendar
    for (const day of generatedPlan) {
      const normalizedDate = new Date(day.date)
      normalizedDate.setHours(0, 0, 0, 0)

      // Check if day plan already exists for this calendar
      let dayPlan = await prisma.dayPlan.findFirst({
        where: {
          userId: user.id,
          calendarId: calendar.id,
          date: normalizedDate,
        },
      })

      if (!dayPlan) {
        dayPlan = await prisma.dayPlan.create({
          data: {
            userId: user.id,
            calendarId: calendar.id,
            date: normalizedDate,
          },
        })
      }

      // Create sessions for this day
      for (const session of day.sessions) {
        // Check if similar session already exists
        const existingSession = await prisma.trainingSession.findFirst({
          where: {
            dayPlanId: dayPlan.id,
            type: session.type,
            title: session.title,
          },
        })

        if (existingSession) continue // Skip if already exists

        const createdSession = await prisma.trainingSession.create({
          data: {
            dayPlanId: dayPlan.id,
            type: session.type,
            title: session.title,
            status: 'planned',
            plannedRpe: session.plannedRpe,
            plannedDuration: session.plannedDuration,
            plannedNotes: session.plannedNotes,
          },
        })

        // Create run details if applicable
        if (session.type === 'run' && session.runDetails) {
          await prisma.runDetails.create({
            data: {
              sessionId: createdSession.id,
              plannedKm: session.runDetails.plannedKm,
              elevationGain: session.runDetails.elevationGain,
              surface: session.runDetails.surface,
            },
          })
        }

        // Create swim details if applicable
        if (session.type === 'swim' && session.swimDetails) {
          await prisma.swimDetails.create({
            data: {
              sessionId: createdSession.id,
              plannedMeters: session.swimDetails.plannedMeters,
              sets: session.swimDetails.sets,
            },
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
                notes: ex.notes,
                order: i,
              },
            })

            if (ex.sets && Array.isArray(ex.sets)) {
              for (const set of ex.sets) {
                await prisma.exerciseSet.create({
                  data: {
                    strengthExerciseId: createdExercise.id,
                    setNumber: set.setNumber,
                    reps: set.reps,
                    load: set.load,
                    rpe: set.rpe,
                    isDropSet: set.isDropSet ?? false,
                    notes: set.notes,
                  },
                })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      id: calendar.id,
      name: calendar.name,
      message: 'Calendar created successfully',
    })
  } catch (error: any) {
    console.error('Error creating calendar:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create calendar' },
      { status: 500 }
    )
  }
}

