'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, startOfWeek } from 'date-fns'

interface DashboardClientProps {
  initialData: {
    sessions: any[]
    painLogs: any[]
    weightLogs: any[]
    weeklyRunTotals: Record<string, number>
    adherence: number
    exerciseProgression: Record<string, Array<{ date: Date; load: number; sets?: number; reps?: number }>>
  }
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  // Prepare running data for chart
  const runChartData = Object.entries(initialData.weeklyRunTotals)
    .map(([weekKey, km]) => ({
      week: format(new Date(weekKey), 'MMM d'),
      km: Number(km.toFixed(1)),
    }))
    .slice(-8) // Last 8 weeks

  // Calculate 4-week rolling average
  const last4Weeks = runChartData.slice(-4)
  const rollingAvg = last4Weeks.length > 0
    ? last4Weeks.reduce((sum, d) => sum + d.km, 0) / last4Weeks.length
    : 0

  // Prepare pain data
  const painChartData = initialData.painLogs.map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    pain: log.kneePain,
  }))

  // Prepare weight data
  const weightChartData = initialData.weightLogs.map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    weight: log.weightKg,
  }))

  // Calculate this week's totals
  const thisWeekSessions = initialData.sessions.filter(s => {
    const sessionDate = new Date(s.dayPlan.date)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  const thisWeekRunKm = thisWeekSessions
    .filter(s => s.type === 'run' && s.runDetails?.completedKm)
    .reduce((sum, s) => sum + (s.runDetails?.completedKm || 0), 0)

  const thisWeekCompleted = thisWeekSessions.filter(s => s.status === 'completed').length
  const thisWeekTotal = thisWeekSessions.length

  // Prepare exercise progression data
  const allExerciseNames = Object.keys(initialData.exerciseProgression)
  const exerciseNamesWithMultiplePoints = allExerciseNames.filter(
    name => initialData.exerciseProgression[name].length > 1 // Exercises with multiple data points
  )
  
  // State for exercise search/filter
  const [searchExercise, setSearchExercise] = useState('')
  
  // Filter exercises based on search
  // If searching, show all matching exercises (even with 1 data point)
  // Otherwise, show only exercises with multiple data points
  const filteredExercises = searchExercise
    ? allExerciseNames.filter(name => 
        name.toLowerCase().includes(searchExercise.toLowerCase())
      )
    : exerciseNamesWithMultiplePoints

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Your training progress and insights</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekRunKm.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground mt-1">Running distance</p>
            <div className="mt-2 text-sm">
              {thisWeekCompleted}/{thisWeekTotal} sessions completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">4-Week Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rollingAvg.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground mt-1">Weekly running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.adherence.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Sessions completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Running distance chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Running Distance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={runChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="km" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pain tracking */}
      {painChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Knee Pain Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={painChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="pain" stroke="hsl(var(--destructive))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weight tracking */}
      {weightChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weight Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Exercise Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Strength Exercise Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hae liikettä</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={searchExercise}
                onChange={(e) => setSearchExercise(e.target.value)}
                placeholder="Kirjoita liikkeen nimi (esim. Bench Press)"
                className="flex-1"
              />
              {searchExercise && (
                <Button variant="outline" onClick={() => setSearchExercise('')}>
                  Tyhjennä
                </Button>
              )}
            </div>
            {searchExercise && filteredExercises.length === 0 && allExerciseNames.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Ei löytynyt liikettä. Kirjoita liikkeen nimi täsmälleen kuten se on kirjattu treeneissä.
              </p>
            )}
          </div>

          {filteredExercises.length > 0 ? (
            filteredExercises.map((exerciseName) => {
            const progression = initialData.exerciseProgression[exerciseName]
            const chartData = progression.map(p => ({
              date: format(new Date(p.date), 'MMM d'),
              load: p.load,
              sets: p.sets,
              reps: p.reps,
            }))
            
            // Show chart even if only one data point (for search results)
            const hasMultiplePoints = progression.length > 1

            return (
              <Card key={exerciseName}>
                <CardHeader>
                  <CardTitle className="text-lg">{exerciseName}</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasMultiplePoints ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis label={{ value: 'Load (kg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value: any, name: string) => {
                            if (name === 'load') return [`${value} kg`, 'Load']
                            return [value, name]
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="load" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>Yksi datapiste. Kirjaa lisää treenejä nähdäksesi kehityksen.</p>
                    </div>
                  )}
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Viimeisin: {chartData[chartData.length - 1]?.load} kg</p>
                    {hasMultiplePoints && (
                      <p>
                        Kehitys: {chartData[chartData.length - 1]?.load - chartData[0]?.load > 0 ? '+' : ''}
                        {(chartData[chartData.length - 1]?.load - chartData[0]?.load).toFixed(1)} kg
                      </p>
                    )}
                    {progression[0] && (
                      <p className="text-xs mt-1">
                        Sets: {progression[0].sets || 'N/A'}, Reps: {progression[0].reps || 'N/A'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })) : (
            <div className="text-center py-8 text-muted-foreground">
              {allExerciseNames.length === 0 ? (
                <p>Ei vielä liikkeitä kirjattu. Aloita kirjaamalla salitreenit!</p>
              ) : (
                <p>Kirjoita liikkeen nimi yllä olevaan hakukenttään.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

