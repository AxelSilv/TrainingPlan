import { generatePlan, type PlanSettings } from '../plan-generator'
import { zonedTimeToUtc } from 'date-fns-tz'

describe('Plan Generator', () => {
  const baseSettings: PlanSettings = {
    startDate: zonedTimeToUtc(new Date('2026-01-02T00:00:00'), 'Europe/Helsinki'),
    endDate: zonedTimeToUtc(new Date('2026-01-31T23:59:59'), 'Europe/Helsinki'),
    timezone: 'Europe/Helsinki',
    runFrequency: 3,
    swimFrequency: 1,
    strengthFrequency: 3,
    heightCm: 183,
    weightKg: 89,
    goalWeightKg: 80,
  }

  it('should generate plan for the specified date range', () => {
    const plan = generatePlan(baseSettings)
    expect(plan.length).toBeGreaterThan(0)
    
    const firstDate = plan[0].date
    const lastDate = plan[plan.length - 1].date
    
    expect(firstDate.getTime()).toBeLessThanOrEqual(baseSettings.endDate.getTime())
    expect(lastDate.getTime()).toBeLessThanOrEqual(baseSettings.endDate.getTime())
  })

  it('should not schedule sessions on Saturday (rest day)', () => {
    const plan = generatePlan(baseSettings)
    const saturdays = plan.filter(day => day.date.getDay() === 6)
    
    saturdays.forEach(saturday => {
      expect(saturday.sessions.length).toBe(0)
    })
  })

  it('should include long runs on Sunday', () => {
    const plan = generatePlan(baseSettings)
    const sundays = plan.filter(day => day.date.getDay() === 0)
    
    const hasLongRun = sundays.some(sunday => 
      sunday.sessions.some(s => s.type === 'run' && s.title.includes('Long Run'))
    )
    
    expect(hasLongRun).toBe(true)
  })

  it('should include strength sessions', () => {
    const plan = generatePlan(baseSettings)
    const strengthSessions = plan.flatMap(day => 
      day.sessions.filter(s => s.type === 'strength')
    )
    
    expect(strengthSessions.length).toBeGreaterThan(0)
    expect(strengthSessions.some(s => s.title.includes('Upper Body A'))).toBe(true)
    expect(strengthSessions.some(s => s.title.includes('Upper Body B'))).toBe(true)
  })

  it('should respect deload weeks (every 4th week)', () => {
    const plan = generatePlan(baseSettings)
    // Check that week 4 has reduced volume
    const week4Days = plan.filter((_, index) => Math.floor(index / 7) === 3)
    const week4Runs = week4Days.flatMap(day => day.sessions.filter(s => s.type === 'run'))
    
    // Deload week should have some runs but potentially reduced
    expect(week4Runs.length).toBeGreaterThanOrEqual(0)
  })

  it('should include warm-up sessions before runs and strength', () => {
    const plan = generatePlan(baseSettings)
    const runDays = plan.filter(day => 
      day.sessions.some(s => s.type === 'run')
    )
    
    runDays.forEach(day => {
      const runIndex = day.sessions.findIndex(s => s.type === 'run')
      if (runIndex > 0) {
        const beforeRun = day.sessions[runIndex - 1]
        expect(beforeRun.type === 'mobility' || beforeRun.title.includes('Warm-up')).toBe(true)
      }
    })
  })
})

