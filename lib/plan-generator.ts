import { addDays, addWeeks, format, getDay, startOfWeek, isSameDay } from 'date-fns'

export type SessionType = 'run' | 'strength' | 'swim' | 'core' | 'mobility' | 'prehab' | 'futsal' | 'padel' | 'sulis'

export interface GeneratedSession {
  type: SessionType
  title: string
  plannedRpe?: number
  plannedDuration?: number
  plannedNotes?: string
  runDetails?: {
    plannedKm?: number
    elevationGain?: number
    surface?: 'trail' | 'road' | 'treadmill'
  }
  strengthExercises?: Array<{
    name: string
    restTime?: number
    notes?: string
    sets: Array<{
      setNumber: number
      reps?: number
      load?: number
      rpe?: number
      isDropSet?: boolean
      notes?: string
    }>
  }>
  swimDetails?: {
    plannedMeters?: number
    sets?: string
  }
}

export interface GeneratedDay {
  date: Date
  sessions: GeneratedSession[]
  warning?: string
}

export interface PlanSettings {
  startDate: Date
  endDate: Date
  timezone: string
  runFrequency: number // 3 or 4
  swimFrequency: number // 1 or 2
  strengthFrequency: number // 3 or 4
  heightCm: number
  weightKg: number
  goalWeightKg: number
}

export function generatePlan(settings: PlanSettings): GeneratedDay[] {
  const { startDate, endDate, timezone, runFrequency, swimFrequency, strengthFrequency } = settings
  
  // Use dates directly (timezone handling is done at display level)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const days: GeneratedDay[] = []
  let currentDate = new Date(start)
  
  // Calculate total weeks
  const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  
  // Futsal dates (replace runs on these dates)
  const futsalDates = [
    new Date('2026-01-11'),
    new Date('2026-01-17'),
    new Date('2026-02-15'),
    new Date('2026-03-21'),
  ].map(d => {
    const date = new Date(d)
    date.setHours(0, 0, 0, 0)
    return date.toDateString()
  })
  
  while (currentDate <= end) {
    const dayOfWeek = getDay(currentDate) // 0 = Sunday, 6 = Saturday
    const dateString = currentDate.toDateString()
    const isFutsalDay = futsalDates.includes(dateString)
    
    // Saturday is rest day with optional light mobility (handled in switch)
    
    const weekNumber = Math.floor((currentDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    const isDeloadWeek = weekNumber % 4 === 0
    const phase = getPhase(weekNumber, totalWeeks)
    
    // Fixed structure: same rhythm every week
    // Only Sunday alternates between Short Run and Swim every other week
    const isEvenWeek = weekNumber % 2 === 0
    
    const daySessions: GeneratedSession[] = []
    let warning: string | undefined
    
    // Special case: Jan 4, 2026 - replace long run with 4.5km easy run
    const jan4Date = new Date('2026-01-04T00:00:00')
    const isJan4 = currentDate.toDateString() === jan4Date.toDateString()
    
    // Generate sessions based on day of week
    // New structure from user requirements:
    // Monday: Leg Day 1 (heavy, quadriceps)
    // Tuesday: Upper Body 1 + core
    // Wednesday: Long Run
    // Thursday: Upper Body 2
    // Friday: Leg Day 2 (hamstrings/glutes + calves)
    // Saturday: Rest / light mobility
    // Sunday: Short Run or Swim
    
    // Check if this is a futsal day (replaces the scheduled session for that day)
    if (isFutsalDay) {
      daySessions.push({
        type: 'futsal',
        title: 'Futsal',
        plannedRpe: 7,
        plannedDuration: 90,
        plannedNotes: 'Futsal game - replaces regular session',
      })
    } else {
      // Generate normal sessions based on day of week
      switch (dayOfWeek) {
        case 0: // Sunday - Short Run or Swim (alternates every other week)
          if (isJan4) {
            // Jan 4 is a Sunday - replace with 4.5km easy run (beginner friendly)
            daySessions.push({
              type: 'run',
              title: 'Easy Run 4.5 km',
              plannedRpe: 5,
              plannedDuration: 27, // ~6 min/km pace
              plannedNotes: 'Easy conversational pace - beginner friendly distance',
              runDetails: {
                plannedKm: 4.5,
                surface: 'road'
              }
            })
          } else {
            daySessions.push(...generateSundaySessions(weekNumber, phase, isDeloadWeek, isEvenWeek))
          }
          break
        case 1: // Monday - Leg Day 1 (heavy, quadriceps)
          const monResult = generateMondaySessions(weekNumber, phase, isDeloadWeek)
          daySessions.push(...monResult.sessions)
          break
        case 2: // Tuesday - Upper Body 1 + core
          daySessions.push(...generateTuesdaySessions(weekNumber, phase, isDeloadWeek))
          break
        case 3: // Wednesday - Long Run
          daySessions.push(...generateWednesdaySessions(weekNumber, phase, isDeloadWeek))
          break
        case 4: // Thursday - Upper Body 2
          daySessions.push(...generateThursdaySessions(weekNumber, phase, isDeloadWeek))
          break
        case 5: // Friday - Leg Day 2 (hamstrings/glutes + calves)
          const friResult = generateFridaySessions(weekNumber, phase, isDeloadWeek)
          daySessions.push(...friResult.sessions)
          break
        case 6: // Saturday - Rest / light mobility
          daySessions.push(...generateSaturdaySessions(weekNumber))
          break
      }
    }
    
    days.push({
      date: new Date(currentDate),
      sessions: daySessions,
      warning
    })
    
    currentDate = addDays(currentDate, 1)
  }
  
  return days
}

function getPhase(weekNumber: number, totalWeeks: number): 'base' | 'build' | 'specific' | 'peak' | 'taper' {
  const taperWeeks = 2
  const peakWeeks = 3
  const specificWeeks = Math.floor(totalWeeks * 0.3)
  const buildWeeks = Math.floor(totalWeeks * 0.3)
  const baseWeeks = totalWeeks - buildWeeks - specificWeeks - peakWeeks - taperWeeks
  
  if (weekNumber <= baseWeeks) return 'base'
  if (weekNumber <= baseWeeks + buildWeeks) return 'build'
  if (weekNumber <= baseWeeks + buildWeeks + specificWeeks) return 'specific'
  if (weekNumber <= baseWeeks + buildWeeks + specificWeeks + peakWeeks) return 'peak'
  return 'taper'
}

function generateSundaySessions(weekNumber: number, phase: string, isDeload: boolean, isEvenWeek: boolean): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Sunday: Short Run or Swim
  // Alternates every other week: even weeks = Swim, odd weeks = Short Run
  if (isEvenWeek) {
    // Even weeks: Swim
    sessions.push({
      type: 'swim',
      title: 'Swim - Recovery',
      plannedRpe: 4,
      plannedDuration: 45,
      plannedNotes: 'Easy aerobic, technique drills',
      swimDetails: {
        plannedMeters: 1200,
        sets: '200 warm-up, 4x50 drill, 4x100 easy, 200 cool-down'
      }
    })
  } else {
    // Odd weeks: Short Run
    const shortRunKm = calculateEasyRunDistance(weekNumber, phase, isDeload)
    sessions.push({
      type: 'run',
      title: `Easy Run ${shortRunKm.toFixed(1)} km`,
      plannedRpe: 5,
      plannedDuration: Math.round(shortRunKm * 6),
      plannedNotes: 'Easy conversational pace',
      runDetails: {
        plannedKm: shortRunKm,
        surface: 'road'
      }
    })
  }
  
  return sessions
}

function generateMondaySessions(weekNumber: number, phase: string, isDeload: boolean): { sessions: GeneratedSession[] } {
  const sessions: GeneratedSession[] = []
  
  // Monday: Leg Day 1 (heavy, quadriceps)
  sessions.push({
    type: 'strength',
    title: 'Leg Day 1 - Quadriceps Focus',
    plannedRpe: isDeload ? 6 : 7,
    plannedDuration: 60,
    plannedNotes: 'Heavy quadriceps focus: squats, leg press, lunges, leg extensions',
    strengthExercises: [
      { name: 'Back Squat', restTime: 180, sets: Array.from({ length: isDeload ? 3 : 4 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Leg Press', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Walking Lunges', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Leg Extension', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Bulgarian Split Squat', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 10 })) }
    ]
  })
  
  return { sessions }
}

function generateTuesdaySessions(weekNumber: number, phase: string, isDeload: boolean): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Tuesday: Upper Body 1 + core
  sessions.push({
    type: 'strength',
    title: 'Upper Body 1',
    plannedRpe: isDeload ? 6 : 7,
    plannedDuration: 60,
    plannedNotes: 'Focus: Chest + Back emphasis (still includes shoulders + arms)',
    strengthExercises: [
      { name: 'Bench Press', restTime: 180, sets: Array.from({ length: isDeload ? 3 : 4 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Barbell Row', restTime: 180, sets: Array.from({ length: isDeload ? 3 : 4 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Incline DB Press', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 10 })) },
      { name: 'Pull-ups', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Lateral Raises', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Tricep Extensions', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Bicep Curls', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) }
    ]
  })
  
  // Core at home
  sessions.push({
    type: 'core',
    title: 'Core Workout',
    plannedDuration: 20,
    plannedNotes: 'Anti-rotation, anti-extension, glute med, back endurance'
  })
  
  return sessions
}

function generateWednesdaySessions(weekNumber: number, phase: string, isDeload: boolean): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Wednesday: Long Run
  const longRunKm = calculateLongRunDistance(weekNumber, phase, isDeload)
  const isTrail = phase === 'specific' || phase === 'peak'
  const elevation = isTrail ? calculateElevation(longRunKm, phase) : 0
  
  sessions.push({
    type: 'run',
    title: `Long Run ${longRunKm.toFixed(1)} km`,
    plannedRpe: phase === 'taper' ? 5 : 6,
    plannedDuration: Math.round(longRunKm * 6), // ~6 min/km pace
    plannedNotes: `Easy aerobic pace. ${isTrail ? 'Trail focus with elevation.' : 'Road/trail mix.'}`,
    runDetails: {
      plannedKm: longRunKm,
      elevationGain: elevation,
      surface: isTrail ? 'trail' : 'road'
    }
  })
  
  return sessions
}

function generateThursdaySessions(weekNumber: number, phase: string, isDeload: boolean): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Thursday: Upper Body 2
  sessions.push({
    type: 'strength',
    title: 'Upper Body 2',
    plannedRpe: isDeload ? 6 : 7,
    plannedDuration: 60,
    plannedNotes: 'Focus: Shoulders + Arms emphasis (still includes chest + back)',
    strengthExercises: [
      { name: 'Overhead Press', restTime: 180, sets: Array.from({ length: isDeload ? 3 : 4 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Weighted Pull-ups', restTime: 180, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Lateral Raises', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Rear Delt Flyes', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Close Grip Bench', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 10 })) },
      { name: 'Tricep Dips', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Hammer Curls', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) }
    ]
  })
  
  return sessions
}

function generateFridaySessions(weekNumber: number, phase: string, isDeload: boolean): { sessions: GeneratedSession[] } {
  const sessions: GeneratedSession[] = []
  
  // Friday: Leg Day 2 (hamstrings/glutes + calves)
  sessions.push({
    type: 'strength',
    title: 'Leg Day 2 - Hamstrings/Glutes + Calves',
    plannedRpe: isDeload ? 6 : 7,
    plannedDuration: 60,
    plannedNotes: 'Focus: Hamstrings, glutes, calves. Deadlifts, RDLs, leg curls, hip thrusts, calf raises.',
    strengthExercises: [
      { name: 'Romanian Deadlift', restTime: 180, sets: Array.from({ length: isDeload ? 3 : 4 }, (_, i) => ({ setNumber: i + 1, reps: 8 })) },
      { name: 'Leg Curl', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 10 })) },
      { name: 'Hip Thrust', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 12 })) },
      { name: 'Calf Raises', restTime: 90, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 15 })) },
      { name: 'Good Mornings', restTime: 120, sets: Array.from({ length: 3 }, (_, i) => ({ setNumber: i + 1, reps: 10 })) }
    ]
  })
  
  return { sessions }
}

function generateSaturdaySessions(weekNumber: number): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Saturday: Rest / light mobility
  // Optional light mobility on some Saturdays
  if (weekNumber % 2 === 0) {
    sessions.push({
      type: 'mobility',
      title: 'Light Mobility',
      plannedDuration: 20,
      plannedNotes: 'Light stretching, foam rolling, recovery work'
    })
  }
  
  return sessions
}

function calculateLongRunDistance(weekNumber: number, phase: string, isDeload: boolean): number {
  if (isDeload) {
    return Math.max(6, calculateLongRunDistance(weekNumber - 1, phase, false) * 0.75)
  }
  
  // Reduced base distances for beginners
  const base = 8 // Reduced from 12
  const progression = Math.min(weekNumber * 0.4, 30) // Reduced progression, cap at 30km
  
  if (phase === 'base') {
    return Math.min(base + progression, 16) // Reduced max from 20
  } else if (phase === 'build') {
    return Math.min(base + progression + 4, 24) // Reduced max from 28
  } else if (phase === 'specific') {
    return Math.min(base + progression + 8, 30) // Reduced max from 35
  } else if (phase === 'peak') {
    return Math.min(base + progression + 10, 35) // Reduced max from 40
  } else {
    // Taper
    return Math.max(12, (base + progression) * 0.6) // Reduced from 15
  }
}

function calculateEasyRunDistance(weekNumber: number, phase: string, isDeload: boolean): number {
  if (isDeload) {
    return 4 // Reduced from 6
  }
  
  // Reduced base distances for beginners
  const base = 4 // Reduced from 6
  const progression = Math.min(weekNumber * 0.15, 3) // Reduced progression
  
  if (phase === 'base') {
    return base + progression
  } else if (phase === 'build') {
    return base + progression + 1.5 // Reduced from +2
  } else if (phase === 'specific' || phase === 'peak') {
    return base + progression + 2.5 // Reduced from +3
  } else {
    return base
  }
}

function calculateElevation(km: number, phase: string): number {
  if (phase === 'specific' || phase === 'peak') {
    return Math.round(km * 50) // 50m elevation per km
  } else if (phase === 'build') {
    return Math.round(km * 30)
  }
  return 0
}

