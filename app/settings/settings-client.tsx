'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import type { UserSettings } from '@prisma/client'

interface SettingsClientProps {
  settings: UserSettings
}

export function SettingsClient({ settings: initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const { toast } = useToast()

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your training preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={settings.heightCm}
                onChange={(e) => setSettings({ ...settings, heightCm: Number(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Current Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.weightKg}
                onChange={(e) => setSettings({ ...settings, weightKg: Number(e.target.value) })}
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label>Goal Weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={settings.goalWeightKg}
              onChange={(e) => setSettings({ ...settings, goalWeightKg: Number(e.target.value) })}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Sex</Label>
            <select
              value={settings.sex}
              onChange={(e) => setSettings({ ...settings, sex: e.target.value })}
              className="w-full mt-2 px-3 py-2 border rounded-md"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Running Sessions per Week</Label>
            <select
              value={settings.runFrequency}
              onChange={(e) => setSettings({ ...settings, runFrequency: Number(e.target.value) })}
              className="w-full mt-2 px-3 py-2 border rounded-md"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          <div>
            <Label>Swimming Sessions per Week</Label>
            <select
              value={settings.swimFrequency}
              onChange={(e) => setSettings({ ...settings, swimFrequency: Number(e.target.value) })}
              className="w-full mt-2 px-3 py-2 border rounded-md"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <div>
            <Label>Strength Sessions per Week</Label>
            <select
              value={settings.strengthFrequency}
              onChange={(e) => setSettings({ ...settings, strengthFrequency: Number(e.target.value) })}
              className="w-full mt-2 px-3 py-2 border rounded-md"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}

