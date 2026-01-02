'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Info } from 'lucide-react'
import type { Session, StrengthExercise, RunDetails, SwimDetails } from '@prisma/client'

interface SessionEditorProps {
  session: Session & {
    runDetails?: RunDetails | null
    swimDetails?: SwimDetails | null
    strengthExercises?: StrengthExercise[]
  }
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function SessionEditor({ session, open, onClose, onUpdate }: SessionEditorProps) {
  const [status, setStatus] = useState(session.status)
  const [completedRpe, setCompletedRpe] = useState(session.completedRpe ?? session.plannedRpe ?? 5)
  const [completedDuration, setCompletedDuration] = useState(session.completedDuration ?? session.plannedDuration ?? undefined)
  const [completedNotes, setCompletedNotes] = useState(session.completedNotes ?? '')
  const [kneePainScore, setKneePainScore] = useState(session.kneePainScore ?? 0)
  
  // Run-specific fields
  const [completedKm, setCompletedKm] = useState<number>(session.runDetails?.completedKm ?? session.runDetails?.plannedKm ?? 0)
  
  // Swim-specific fields
  const [completedMeters, setCompletedMeters] = useState<number>(session.swimDetails?.completedMeters ?? session.swimDetails?.plannedMeters ?? 0)
  
  // Strength exercises state
  const [exercises, setExercises] = useState<Array<{
    id?: string
    name: string
    sets?: number
    reps?: number
    load?: number
    restTime?: number
    tempo?: string
    rpe?: number
    notes?: string
  }>>(session.strengthExercises?.map(ex => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets ?? undefined,
    reps: ex.reps ?? undefined,
    load: ex.load ?? undefined,
    restTime: ex.restTime ?? undefined,
    tempo: ex.tempo ?? undefined,
    rpe: ex.rpe ?? undefined,
    notes: ex.notes ?? undefined,
  })) || [])
  
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setStatus(session.status)
      setCompletedRpe(session.completedRpe ?? session.plannedRpe ?? 5)
      setCompletedDuration(session.completedDuration ?? session.plannedDuration ?? undefined)
      setCompletedNotes(session.completedNotes ?? '')
      setKneePainScore(session.kneePainScore ?? 0)
      setCompletedKm(session.runDetails?.completedKm ?? session.runDetails?.plannedKm ?? 0)
      setCompletedMeters(session.swimDetails?.completedMeters ?? session.swimDetails?.plannedMeters ?? 0)
      setExercises(session.strengthExercises?.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets ?? undefined,
        reps: ex.reps ?? undefined,
        load: ex.load ?? undefined,
        restTime: ex.restTime ?? undefined,
        tempo: ex.tempo ?? undefined,
        rpe: ex.rpe ?? undefined,
        notes: ex.notes ?? undefined,
      })) || [])
    }
  }, [open, session])

  const handleSave = async () => {
    try {
      const updateData: any = {
        status,
        completedRpe,
        completedDuration: completedDuration || null,
        completedNotes,
        kneePainScore: (session.type === 'run' && kneePainScore > 0) ? kneePainScore : null,
      }

      if (session.type === 'run' && session.runDetails) {
        updateData.runDetails = {
          completedKm: completedKm > 0 ? completedKm : null,
        }
      }

      if (session.type === 'swim' && session.swimDetails) {
        updateData.swimDetails = {
          completedMeters: completedMeters > 0 ? completedMeters : null,
        }
      }

      if (session.type === 'strength' && exercises.length > 0) {
        updateData.strengthExercises = exercises
      }

      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) throw new Error('Failed to update session')

      toast({
        title: 'Session updated',
        description: 'Your session has been saved.',
      })

      onUpdate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update session. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleQuickComplete = async () => {
    setStatus('completed')
    await handleSave()
  }

  const handleSkip = async () => {
    setStatus('skipped')
    await handleSave()
  }

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: undefined, reps: undefined, load: undefined }])
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const rpeDescription = (rpe: number) => {
    if (rpe <= 2) return 'Very easy - No effort'
    if (rpe <= 4) return 'Easy - Light effort'
    if (rpe <= 6) return 'Moderate - Comfortable effort'
    if (rpe <= 8) return 'Hard - Challenging effort'
    return 'Very hard - Maximum effort'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session.title}</DialogTitle>
          <DialogDescription>
            {session.type} • {session.plannedNotes}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button onClick={handleQuickComplete} className="flex-1">
              Mark Complete
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <div className="flex gap-2 mt-2">
              {(['planned', 'completed', 'skipped'] as const).map((s) => (
                <Button
                  key={s}
                  variant={status === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* RPE */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>RPE: {completedRpe}</Label>
              <div className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-popover border rounded-md p-2 text-xs shadow-lg z-50 w-64">
                  <strong>RPE (Rate of Perceived Exertion)</strong>
                  <p className="mt-1">1-10 asteikko kuvaamaan kuinka vaikealta harjoitus tuntui:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>1-2: Erittäin helppo</li>
                    <li>3-4: Helppo</li>
                    <li>5-6: Kohtalainen</li>
                    <li>7-8: Vaikea</li>
                    <li>9-10: Erittäin vaikea</li>
                  </ul>
                </div>
              </div>
            </div>
            <Slider
              value={[completedRpe]}
              onValueChange={([value]) => setCompletedRpe(value)}
              min={1}
              max={10}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">{rpeDescription(completedRpe)}</p>
          </div>

          {/* Duration */}
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={completedDuration ?? ''}
              onChange={(e) => setCompletedDuration(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Enter duration"
              className="mt-2"
            />
          </div>

          {/* Run-specific */}
          {session.type === 'run' && (
            <div>
              <Label>Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={completedKm}
                onChange={(e) => setCompletedKm(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          )}

          {/* Swim-specific */}
          {session.type === 'swim' && (
            <div>
              <Label>Distance (meters)</Label>
              <Input
                type="number"
                value={completedMeters}
                onChange={(e) => setCompletedMeters(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          )}

          {/* Strength exercises */}
          {session.type === 'strength' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  + Add Exercise
                </Button>
              </div>
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      {exercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                          className="ml-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Input
                        type="number"
                        placeholder="Sets"
                        value={exercise.sets ?? ''}
                        onChange={(e) => updateExercise(index, 'sets', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={exercise.reps ?? ''}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Load (kg)"
                        value={exercise.load ?? ''}
                        onChange={(e) => updateExercise(index, 'load', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <Input
                        type="number"
                        placeholder="RPE"
                        min="1"
                        max="10"
                        value={exercise.rpe ?? ''}
                        onChange={(e) => updateExercise(index, 'rpe', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Rest (sec)"
                        value={exercise.restTime ?? ''}
                        onChange={(e) => updateExercise(index, 'restTime', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <Input
                        placeholder="Tempo (e.g. 3-1-1-0)"
                        value={exercise.tempo ?? ''}
                        onChange={(e) => updateExercise(index, 'tempo', e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Notes (optional)"
                      value={exercise.notes ?? ''}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                    />
                  </div>
                ))}
                {exercises.length === 0 && (
                  <Button type="button" variant="outline" onClick={addExercise} className="w-full">
                    + Add First Exercise
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Knee pain - only for runs */}
          {session.type === 'run' && (
            <div>
              <Label>Knee Pain: {kneePainScore}/10</Label>
              <Slider
                value={[kneePainScore]}
                onValueChange={([value]) => setKneePainScore(value)}
                min={0}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              value={completedNotes}
              onChange={(e) => setCompletedNotes(e.target.value)}
              className="w-full mt-2 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Add notes about your session..."
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
