import { Navigation, TopBar } from '@/components/navigation'
import { SettingsClient } from './settings-client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getSettings() {
  let settings = await prisma.userSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (!settings) {
    settings = await prisma.userSettings.create({
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
        restDay: 'saturday',
      },
    })
  }

  return { settings }
}

export default async function SettingsPage() {
  const { settings } = await getSettings()

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navigation />
      <div className="flex-1 md:ml-64 pb-16 md:pb-0">
        <SettingsClient settings={settings} />
      </div>
    </div>
  )
}

