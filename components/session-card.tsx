'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle2, Circle, XCircle, Activity, Waves, Dumbbell, Target, StretchHorizontal, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Session } from '@prisma/client'

const typeIcons = {
  run: Activity,
  swim: Waves,
  strength: Dumbbell,
  core: Target,
  mobility: StretchHorizontal,
  prehab: Heart,
  padel: Activity,
  sulis: Activity,
  futsal: Activity,
}

const typeColors = {
  run: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  swim: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  strength: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  core: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  mobility: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  prehab: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  padel: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  sulis: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  futsal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

interface SessionCardProps {
  session: Session & {
    runDetails?: { plannedKm?: number | null; completedKm?: number | null } | null
    swimDetails?: { plannedMeters?: number | null; completedMeters?: number | null } | null
    strengthExercises?: Array<{ name: string }>
  }
  onClick?: () => void
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  // For custom types, use Activity icon and gray color
  const isCustomType = !typeIcons[session.type as keyof typeof typeIcons]
  const Icon = isCustomType ? Activity : (typeIcons[session.type as keyof typeof typeIcons] || Activity)
  const colorClass = isCustomType ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' : (typeColors[session.type as keyof typeof typeColors] || 'bg-gray-100')

  const getStatusIcon = () => {
    if (session.status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (session.status === 'skipped') return <XCircle className="h-4 w-4 text-gray-400" />
    return <Circle className="h-4 w-4 text-gray-300" />
  }

  const getKeyMetric = () => {
    if (session.type === 'run' && session.runDetails) {
      const km = session.runDetails.completedKm ?? session.runDetails.plannedKm
      return km ? `${km.toFixed(1)} km` : null
    }
    if (session.type === 'swim' && session.swimDetails) {
      const m = session.swimDetails.completedMeters ?? session.swimDetails.plannedMeters
      return m ? `${m} m` : null
    }
    if (session.type === 'strength' && session.strengthExercises) {
      return `${session.strengthExercises.length} exercises`
    }
    if (session.plannedDuration) {
      return `${session.plannedDuration} min`
    }
    return null
  }

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-shadow",
        session.status === 'completed' && "opacity-75",
        session.status === 'skipped' && "opacity-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className={cn("p-1.5 rounded", colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{session.title}</h4>
            {getKeyMetric() && (
              <p className="text-xs text-muted-foreground mt-0.5">{getKeyMetric()}</p>
            )}
            {session.kneePainScore !== null && session.kneePainScore > 0 && (
              <p className="text-xs text-red-600 mt-0.5">Knee pain: {session.kneePainScore}/10</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
      </div>
    </Card>
  )
}

