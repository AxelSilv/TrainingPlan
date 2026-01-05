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
    sets?: number
    reps?: number
    load?: number
    restTime?: number
    tempo?: string
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
    
    // Saturday is always rest day
    if (dayOfWeek === 6) {
      currentDate = addDays(currentDate, 1)
      continue
    }
    
    const weekNumber = Math.floor((currentDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    const isDeloadWeek = weekNumber % 4 === 0
    const phase = getPhase(weekNumber, totalWeeks)
    
    // Variable swim frequency: 1-2 per week (alternating or based on week)
    const weekSwimFrequency = (weekNumber % 3 === 0) ? 2 : 1
    
    // Variable run frequency: 3-4 per week (more runs in later phases)
    let weekRunFrequency = runFrequency
    if (phase === 'specific' || phase === 'peak') {
      weekRunFrequency = 4 // More runs in specific/peak phase
    } else if (phase === 'base' && weekNumber <= 8) {
      weekRunFrequency = 3 // Base phase starts with 3 runs/week
    }
    
    const daySessions: GeneratedSession[] = []
    let warning: string | undefined
    
    // Special case: Jan 4, 2026 - replace long run with 4.5km easy run
    const jan4Date = new Date('2026-01-04T00:00:00')
    const isJan4 = currentDate.toDateString() === jan4Date.toDateString()
    
    // Check if this is a futsal day (replace run with futsal)
    if (isFutsalDay) {
      daySessions.push({
        type: 'futsal',
        title: 'Futsal',
        plannedRpe: 7,
        plannedDuration: 90,
        plannedNotes: 'Futsal game - replaces regular run',
      })
    } else if (isJan4 && dayOfWeek === 0) {
      // Jan 4 is a Sunday - replace long run with 4.5km easy run
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
      // Still add mobility
      daySessions.push({
        type: 'mobility',
        title: 'Recovery Mobility',
        plannedDuration: 20,
        plannedNotes: 'Full body stretching, foam rolling, hip mobility'
      })
    } else {
      // Generate sessions based on day of week
      // Structure: 2 leg days + 2 upper body days per week
      // Monday: Upper A, Wednesday: Legs, Friday: Upper B, Sunday: Long run
      // Tuesday/Thursday: Easy runs, swims, core, mobility
      switch (dayOfWeek) {
        case 0: // Sunday - Long run day
          daySessions.push(...generateSundaySessions(weekNumber, phase, isDeloadWeek, weekRunFrequency))
          break
        case 1: // Monday - Upper Body A
          daySessions.push(...generateMondaySessions(weekNumber, phase, isDeloadWeek, weekSwimFrequency))
          break
        case 2: // Tuesday - Easy run + Core (or futsal if scheduled)
          if (!isFutsalDay) {
            daySessions.push(...generateTuesdaySessions(weekNumber, phase, isDeloadWeek, weekRunFrequency, weekSwimFrequency))
          }
          break
        case 3: // Wednesday - Leg Day 1
          const wedResult = generateWednesdaySessions(weekNumber, phase, isDeloadWeek, days, currentDate, weekRunFrequency)
          daySessions.push(...wedResult.sessions)
          if (wedResult.warning) warning = wedResult.warning
          break
        case 4: // Thursday - Easy run + Swim + Mobility (or futsal if scheduled)
          if (!isFutsalDay) {
            daySessions.push(...generateThursdaySessions(weekNumber, phase, isDeloadWeek, weekRunFrequency, weekSwimFrequency))
          }
          break
        case 5: // Friday - Upper Body B OR Leg Day 2 (alternating weeks for 2 leg days/week)
          daySessions.push(...generateFridaySessions(weekNumber, phase, isDeloadWeek, weekSwimFrequency))
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

function generateSundaySessions(weekNumber: number, phase: string, isDeload: boolean, runFrequency: number): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Long run on Sunday
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
  
  // Evening mobility/stretch - shorter on Sunday if there are other mobility days in the week
  // Check if there are other mobility days (we'll add them to other days)
  const hasOtherMobility = weekNumber % 2 === 0 // Add to some other days
  const mobilityDuration = hasOtherMobility ? 15 : 25 // Shorter if there are other mobility days
  
  sessions.push({
    type: 'mobility',
    title: 'Recovery Mobility',
    plannedDuration: mobilityDuration,
    plannedNotes: 'Full body stretching, foam rolling, hip mobility'
  })
  
  return sessions
}

function generateMondaySessions(weekNumber: number, phase: string, isDeload: boolean, swimFrequency: number): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Strength session
  sessions.push({
    type: 'strength',
    title: 'Upper Body A',
    plannedRpe: isDeload ? 6 : 7,
    plannedDuration: 60,
    plannedNotes: 'Focus: Chest + Back emphasis (still includes shoulders + arms)',
    strengthExercises: [
      { name: 'Bench Press', sets: isDeload ? 3 : 4, reps: 8, load: undefined, restTime: 180, tempo: '3-1-1-0' },
      { name: 'Barbell Row', sets: isDeload ? 3 : 4, reps: 8, restTime: 180, tempo: '2-1-1-0' },
      { name: 'Incline DB Press', sets: 3, reps: 10, restTime: 120 },
      { name: 'Pull-ups', sets: 3, reps: 8, restTime: 120 },
      { name: 'Lateral Raises', sets: 3, reps: 12, restTime: 90 },
      { name: 'Tricep Extensions', sets: 3, reps: 12, restTime: 90 },
      { name: 'Bicep Curls', sets: 3, reps: 12, restTime: 90 }
    ]
  })
  
  // Optional swim on Monday (if 2 swims/week and week allows)
  if (swimFrequency >= 2 && weekNumber % 2 === 0) {
    sessions.push({
      type: 'swim',
      title: 'Swim - Recovery',
      plannedRpe: 4,
      plannedDuration: 45,
      plannedNotes: 'Evening swim after strength, easy recovery',
      swimDetails: {
        plannedMeters: 1200,
        sets: '200 warm-up, 4x50 drill, 4x100 easy, 200 cool-down'
      }
    })
  }
  
  return sessions
}

function generateTuesdaySessions(weekNumber: number, phase: string, isDeload: boolean, runFrequency: number, swimFrequency: number): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Easy run (if 4 runs/week)
  if (runFrequency >= 4) {
    const easyKm = calculateEasyRunDistance(weekNumber, phase, isDeload)
    sessions.push({
      type: 'run',
      title: `Easy Run ${easyKm.toFixed(1)} km`,
      plannedRpe: 5,
      plannedDuration: Math.round(easyKm * 6),
      plannedNotes: 'Easy conversational pace',
      runDetails: {
        plannedKm: easyKm,
        surface: 'road'
      }
    })
  }
  
  // Optional swim (if 2 swims/week and not on Monday)
  if (swimFrequency >= 2 && weekNumber % 2 === 1) {
    sessions.push({
      type: 'swim',
      title: 'Swim - Technique Focus',
      plannedRpe: 4,
      plannedDuration: 45,
      plannedNotes: 'Morning swim, recovery + skill work',
      swimDetails: {
        plannedMeters: 1200,
        sets: '200 warm-up, 4x50 drill, 4x100 easy, 200 cool-down'
      }
    })
  }
  
  // Core at home
  sessions.push({
    type: 'core',
    title: 'Core Workout',
    plannedDuration: 20,
    plannedNotes: 'Anti-rotation, anti-extension, glute med, back endurance'
  })
  
  // Recovery mobility on some Tuesdays (if not on Sunday or other days)
  if (weekNumber % 3 === 0) {
    sessions.push({
      type: 'mobility',
      title: 'Recovery Mobility',
      plannedDuration: 20,
      plannedNotes: 'Evening mobility, stretching, foam rolling'
    })
  }
  
  return sessions
}

function generateWednesdaySessions(weekNumber: number, phase: string, isDeload: boolean, previousDays: GeneratedDay[], currentDate: Date, runFrequency: number): { sessions: GeneratedSession[], warning?: string } {
  const sessions: GeneratedSession[] = []
  let warning: string | undefined
  
  // Wednesday - Leg Day 1 (alternating posterior/anterior focus)
  const isPosteriorFocus = weekNumber % 2 === 1 // Odd weeks = posterior, even weeks = anterior
  const legTitle = isPosteriorFocus ? 'Lower Body - Posterior Focus' : 'Lower Body - Anterior Focus'
  const legNotes = isPosteriorFocus 
    ? 'Focus: Hamstrings, glutes, calves. Deadlifts, RDLs, leg curls, calf raises.'
    : 'Focus: Quads, glutes. Squats, leg press, lunges, leg extensions.'
  
  sessions.push({
    type: 'strength',
    title: legTitle,
    plannedRpe: isDeload ? 6 : 7,
    plannedDuration: 60,
    plannedNotes: legNotes,
    strengthExercises: isPosteriorFocus ? [
      { name: 'Romanian Deadlift', sets: isDeload ? 3 : 4, reps: 8, restTime: 180, tempo: '3-1-1-0' },
      { name: 'Leg Curl', sets: 3, reps: 10, restTime: 120 },
      { name: 'Hip Thrust', sets: 3, reps: 12, restTime: 120 },
      { name: 'Calf Raises', sets: 3, reps: 15, restTime: 90 },
      { name: 'Good Mornings', sets: 3, reps: 10, restTime: 120 }
    ] : [
      { name: 'Back Squat', sets: isDeload ? 3 : 4, reps: 8, restTime: 180, tempo: '3-1-1-0' },
      { name: 'Leg Press', sets: 3, reps: 12, restTime: 120 },
      { name: 'Walking Lunges', sets: 3, reps: 12, restTime: 120 },
      { name: 'Leg Extension', sets: 3, reps: 12, restTime: 90 },
      { name: 'Bulgarian Split Squat', sets: 3, reps: 10, restTime: 120 }
    ]
  })
  
  return { sessions, warning }
}

function generateThursdaySessions(weekNumber: number, phase: string, isDeload: boolean, runFrequency: number, swimFrequency: number): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Easy run
  const easyKm = calculateEasyRunDistance(weekNumber, phase, isDeload)
  sessions.push({
    type: 'run',
    title: `Easy Run ${easyKm.toFixed(1)} km`,
    plannedRpe: 5,
    plannedDuration: Math.round(easyKm * 6),
    plannedNotes: 'Easy conversational pace',
    runDetails: {
      plannedKm: easyKm,
      surface: 'road'
    }
  })
  
  // Swim (primary swim day - can be same day as run)
  if (swimFrequency >= 1) {
    sessions.push({
      type: 'swim',
      title: 'Swim - Recovery',
      plannedRpe: 4,
      plannedDuration: 45,
      plannedNotes: 'Morning swim, easy aerobic, technique drills',
      swimDetails: {
        plannedMeters: 1500,
        sets: '300 warm-up, 6x50 drill, 4x100 easy, 200 cool-down'
      }
    })
  }
  
  // Optional core
  if (weekNumber % 2 === 0) {
    sessions.push({
      type: 'core',
      title: 'Core Workout',
      plannedDuration: 20,
      plannedNotes: 'Anti-rotation, anti-extension focus'
    })
  }
  
  // Recovery mobility on some Thursdays
  if (weekNumber % 3 === 1) {
    sessions.push({
      type: 'mobility',
      title: 'Recovery Mobility',
      plannedDuration: 20,
      plannedNotes: 'Evening mobility, stretching, foam rolling'
    })
  }
  
  return sessions
}

function generateFridaySessions(weekNumber: number, phase: string, isDeload: boolean, swimFrequency: number): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  
  // Friday alternates: Upper Body B OR Leg Day 2
  // Week 1, 3, 5... = Upper Body B
  // Week 2, 4, 6... = Leg Day 2 (to get 2 leg days per week)
  const isUpperWeek = weekNumber % 2 === 1
  
  if (isUpperWeek) {
    // Upper Body B
    sessions.push({
      type: 'strength',
      title: 'Upper Body B',
      plannedRpe: isDeload ? 6 : 7,
      plannedDuration: 60,
      plannedNotes: 'Focus: Shoulders + Arms emphasis (still includes chest + back)',
      strengthExercises: [
        { name: 'Overhead Press', sets: isDeload ? 3 : 4, reps: 8, restTime: 180, tempo: '3-1-1-0' },
        { name: 'Weighted Pull-ups', sets: 3, reps: 8, restTime: 180 },
        { name: 'Lateral Raises', sets: 3, reps: 12, restTime: 90 },
        { name: 'Rear Delt Flyes', sets: 3, reps: 12, restTime: 90 },
        { name: 'Close Grip Bench', sets: 3, reps: 10, restTime: 120 },
        { name: 'Tricep Dips', sets: 3, reps: 12, restTime: 90 },
        { name: 'Hammer Curls', sets: 3, reps: 12, restTime: 90 }
      ]
    })
  } else {
    // Leg Day 2 (opposite focus from Wednesday)
    const wedIsPosterior = weekNumber % 2 === 1
    const legTitle = wedIsPosterior ? 'Lower Body - Anterior Focus' : 'Lower Body - Posterior Focus'
    const legNotes = wedIsPosterior
      ? 'Focus: Quads, glutes. Squats, leg press, lunges, leg extensions.'
      : 'Focus: Hamstrings, glutes, calves. Deadlifts, RDLs, leg curls, calf raises.'
    
    sessions.push({
      type: 'strength',
      title: legTitle,
      plannedRpe: isDeload ? 6 : 7,
      plannedDuration: 60,
      plannedNotes: legNotes,
      strengthExercises: wedIsPosterior ? [
        { name: 'Back Squat', sets: isDeload ? 3 : 4, reps: 8, restTime: 180, tempo: '3-1-1-0' },
        { name: 'Leg Press', sets: 3, reps: 12, restTime: 120 },
        { name: 'Walking Lunges', sets: 3, reps: 12, restTime: 120 },
        { name: 'Leg Extension', sets: 3, reps: 12, restTime: 90 },
        { name: 'Bulgarian Split Squat', sets: 3, reps: 10, restTime: 120 }
      ] : [
        { name: 'Romanian Deadlift', sets: isDeload ? 3 : 4, reps: 8, restTime: 180, tempo: '3-1-1-0' },
        { name: 'Leg Curl', sets: 3, reps: 10, restTime: 120 },
        { name: 'Hip Thrust', sets: 3, reps: 12, restTime: 120 },
        { name: 'Calf Raises', sets: 3, reps: 15, restTime: 90 },
        { name: 'Good Mornings', sets: 3, reps: 10, restTime: 120 }
      ]
    })
  }
  
  // Optional swim on Friday (if 2 swims/week and week allows)
  if (swimFrequency >= 2 && weekNumber % 3 === 0) {
    sessions.push({
      type: 'swim',
      title: 'Swim - Technique',
      plannedRpe: 4,
      plannedDuration: 45,
      plannedNotes: 'Evening swim after strength, technique focus',
      swimDetails: {
        plannedMeters: 1200,
        sets: '200 warm-up, 6x50 drill, 4x100 easy, 200 cool-down'
      }
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

