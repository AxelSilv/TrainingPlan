'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { calculateBMR, getActivityMultiplier, calculateTDEE, calculateCalorieTarget, calculateMacros } from '@/lib/nutrition'
import type { UserSettings } from '@prisma/client'

interface NutritionClientProps {
  settings: UserSettings
}

export function NutritionClient({ settings }: NutritionClientProps) {
  const [weeklyRunKm, setWeeklyRunKm] = useState(30) // Default estimate
  const [strengthSessions, setStrengthSessions] = useState(3)
  const [swimSessions, setSwimSessions] = useState(1)
  const [isRunDay, setIsRunDay] = useState(false)

  const age = 23 // From user profile
  const bmr = calculateBMR(settings.weightKg, settings.heightCm, age, settings.sex as 'male' | 'female')
  const activityMultiplier = getActivityMultiplier(weeklyRunKm, strengthSessions, swimSessions)
  const tdee = calculateTDEE(bmr, activityMultiplier)
  const calorieTarget = calculateCalorieTarget(tdee, settings.goalWeightKg, settings.weightKg)
  const macros = calculateMacros(calorieTarget, settings.weightKg, isRunDay)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">Nutrition</h1>
        <p className="text-muted-foreground">Calorie and macro targets for your training</p>
      </div>

      {/* Calorie target */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Calorie Target</CardTitle>
          <CardDescription>
            Based on your profile: {settings.heightCm} cm, {settings.weightKg} kg, goal: {settings.goalWeightKg} kg
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">BMR</p>
              <p className="text-2xl font-bold">{Math.round(bmr)} kcal</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activity Factor</p>
              <p className="text-2xl font-bold">{activityMultiplier.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TDEE</p>
              <p className="text-2xl font-bold">{Math.round(tdee)} kcal</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target</p>
              <p className="text-2xl font-bold text-primary">{calorieTarget} kcal</p>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <label className="text-sm font-medium">Weekly Running (km)</label>
            <input
              type="number"
              value={weeklyRunKm}
              onChange={(e) => setWeeklyRunKm(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Strength Sessions/week</label>
              <input
                type="number"
                value={strengthSessions}
                onChange={(e) => setStrengthSessions(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md mt-2"
                min="0"
                max="7"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Swim Sessions/week</label>
              <input
                type="number"
                value={swimSessions}
                onChange={(e) => setSwimSessions(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md mt-2"
                min="0"
                max="7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macros */}
      <Card>
        <CardHeader>
          <CardTitle>Macro Targets</CardTitle>
          <CardDescription>
            {isRunDay ? 'Run day (higher carbs)' : 'Regular day'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="runDay"
              checked={isRunDay}
              onChange={(e) => setIsRunDay(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="runDay" className="text-sm">Today is a run day</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Protein</p>
              <p className="text-3xl font-bold">{macros.protein}g</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((macros.protein / settings.weightKg).toFixed(1))} g/kg
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Carbs</p>
              <p className="text-3xl font-bold">{macros.carbs}g</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((macros.carbs * 4 / macros.calories) * 100)}% of calories
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Fats</p>
              <p className="text-3xl font-bold">{macros.fats}g</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((macros.fats * 9 / macros.calories) * 100)}% of calories
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fueling guide */}
      <Card>
        <CardHeader>
          <CardTitle>Long Run Fueling Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Carbohydrates</h4>
            <p className="text-sm text-muted-foreground">
              Aim for 30-60g carbs per hour for runs over 90 minutes. Use gels, sports drinks, or real food.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Hydration</h4>
            <p className="text-sm text-muted-foreground">
              Drink 150-250ml every 15-20 minutes. Adjust based on sweat rate and conditions.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Electrolytes</h4>
            <p className="text-sm text-muted-foreground">
              For runs over 2 hours, include sodium (300-600mg/hour) to prevent hyponatremia.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Pre-run Meal</h4>
            <p className="text-sm text-muted-foreground">
              Eat 2-3 hours before: 50-100g carbs, low fat/fiber. Examples: banana + toast, oatmeal, or sports drink.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

