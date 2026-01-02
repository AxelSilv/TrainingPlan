import { Navigation, TopBar } from '@/components/navigation'
import { NutritionClient } from './nutrition-client'
import { prisma } from '@/lib/prisma'

async function getNutritionData() {
  const settings = await prisma.userSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (!settings) {
    // Create default settings
    const defaultSettings = await prisma.userSettings.create({
      data: {
        id: 'singleton',
        timezone: 'Europe/Helsinki',
        sex: 'male',
        heightCm: 183,
        weightKg: 89.0,
        goalWeightKg: 80.0,
      },
    })
    return { settings: defaultSettings }
  }

  return { settings }
}

export default async function NutritionPage() {
  const { settings } = await getNutritionData()

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navigation />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <NutritionClient settings={settings} />
      </div>
    </div>
  )
}

