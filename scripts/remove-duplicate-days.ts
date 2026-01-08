import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding duplicate DayPlan records...')
  
  // Find all day plans
  const allDayPlans = await prisma.dayPlan.findMany({
    include: {
      sessions: true,
    },
    orderBy: { date: 'asc' },
  })
  
  // Group by normalized date
  const normalizeDate = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }
  
  const dateGroups = new Map<string, typeof allDayPlans>()
  
  for (const dp of allDayPlans) {
    const key = normalizeDate(dp.date)
    if (!dateGroups.has(key)) {
      dateGroups.set(key, [])
    }
    dateGroups.get(key)!.push(dp)
  }
  
  // Find duplicates
  const duplicates: Array<{ date: string; count: number; ids: string[] }> = []
  
  for (const [date, plans] of dateGroups.entries()) {
    if (plans.length > 1) {
      duplicates.push({
        date,
        count: plans.length,
        ids: plans.map(p => p.id),
      })
    }
  }
  
  console.log(`Found ${duplicates.length} dates with duplicates`)
  
  // For each duplicate, keep the first one and merge sessions, then delete others
  for (const dup of duplicates) {
    const plans = allDayPlans.filter(p => dup.ids.includes(p.id))
    const keep = plans[0] // Keep the first one
    const toDelete = plans.slice(1)
    
    // Move all sessions from duplicates to the kept one
    for (const del of toDelete) {
      await prisma.session.updateMany({
        where: { dayPlanId: del.id },
        data: { dayPlanId: keep.id },
      })
      
      // Delete the duplicate day plan
      await prisma.dayPlan.delete({
        where: { id: del.id },
      })
    }
    
    console.log(`✅ Merged ${dup.count - 1} duplicates for ${dup.date}, kept ${keep.id}`)
  }
  
  console.log('✅ Duplicate removal completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

