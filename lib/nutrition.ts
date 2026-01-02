// Mifflin-St Jeor equation for BMR calculation
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }
}

// Activity multiplier based on weekly training load
export function getActivityMultiplier(weeklyRunKm: number, strengthSessions: number, swimSessions: number): number {
  const totalLoad = weeklyRunKm + (strengthSessions * 0.5) + (swimSessions * 0.3)
  
  if (totalLoad < 20) return 1.4 // Sedentary
  if (totalLoad < 40) return 1.6 // Lightly active
  if (totalLoad < 60) return 1.75 // Moderately active
  if (totalLoad < 80) return 1.9 // Very active
  return 2.1 // Extremely active
}

export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier
}

export function calculateCalorieTarget(tdee: number, goalWeightKg: number, currentWeightKg: number): number {
  // For slow cut: aim for 300-500 kcal deficit
  const deficit = currentWeightKg > goalWeightKg ? 400 : 0
  return Math.round(tdee - deficit)
}

export function calculateMacros(calories: number, weightKg: number, isRunDay: boolean) {
  const proteinG = Math.round(weightKg * 1.8) // 1.8 g/kg
  const proteinCal = proteinG * 4
  
  const fatG = Math.round(calories * 0.25 / 9) // 25% of calories
  const fatCal = fatG * 9
  
  const carbCal = calories - proteinCal - fatCal
  const carbG = Math.round(carbCal / 4)
  
  // Adjust for run days (higher carbs)
  if (isRunDay) {
    const extraCarbs = 50 // extra 50g carbs on run days
    return {
      protein: proteinG,
      carbs: carbG + extraCarbs,
      fats: fatG,
      calories: calories + (extraCarbs * 4)
    }
  }
  
  return {
    protein: proteinG,
    carbs: carbG,
    fats: fatG,
    calories
  }
}

