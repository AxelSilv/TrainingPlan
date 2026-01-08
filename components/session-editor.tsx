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
import type { Session, StrengthExercise, RunDetails, SwimDetails, ExerciseSet } from '@prisma/client'

interface SessionEditorProps {
  session: Session & {
    runDetails?: RunDetails | null
    swimDetails?: SwimDetails | null
    strengthExercises?: (StrengthExercise & {
      sets?: ExerciseSet[]
    })[]
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
  
  // Strength exercises state - each exercise has an array of sets
  const [exercises, setExercises] = useState<Array<{
    id?: string
    name: string
    restTime?: number
    notes?: string
    sets: Array<{
      id?: string
      setNumber: number
      reps?: number
      load?: number
      rpe?: number
      isDropSet?: boolean
      notes?: string
    }>
  }>>(session.strengthExercises?.map(ex => ({
    id: ex.id,
    name: ex.name,
    restTime: ex.restTime ?? undefined,
    notes: ex.notes ?? undefined,
    sets: ex.sets && ex.sets.length > 0 
      ? ex.sets.map(s => ({
          id: s.id,
          setNumber: s.setNumber,
          reps: s.reps ?? undefined,
          load: s.load ?? undefined,
          rpe: s.rpe ?? undefined,
          isDropSet: (s as any).isDropSet ?? false,
          notes: s.notes ?? undefined,
        }))
      : [{ setNumber: 1, reps: undefined, load: undefined, rpe: undefined, isDropSet: false, notes: undefined }]
  })) || [])
  
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  
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
        restTime: ex.restTime ?? undefined,
        notes: ex.notes ?? undefined,
        sets: ex.sets && ex.sets.length > 0
          ? ex.sets.map(s => ({
              id: s.id,
              setNumber: s.setNumber,
              reps: s.reps ?? undefined,
              load: s.load ?? undefined,
              rpe: s.rpe ?? undefined,
              isDropSet: (s as any).isDropSet ?? false,
              notes: s.notes ?? undefined,
            }))
          : [{ setNumber: 1, reps: undefined, load: undefined, rpe: undefined, isDropSet: false, notes: undefined }]
      })) || [])
    }
  }, [open, session])

  const handleSave = async (showToast = true) => {
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

      if (showToast) {
        toast({
          title: 'Session updated',
          description: 'Your session has been saved.',
        })
      }

      onUpdate()
    } catch (error) {
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Failed to update session. Please try again.',
          variant: 'destructive',
        })
      }
    }
  }
  
  // Auto-save function with debounce
  const triggerAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    const timeout = setTimeout(() => {
      handleSave(false) // Don't show toast for auto-save
    }, 1000) // 1 second debounce
    setAutoSaveTimeout(timeout)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [autoSaveTimeout])

  const handleQuickComplete = async () => {
    setStatus('completed')
    await handleSave()
  }

  const handleSkip = async () => {
    setStatus('skipped')
    await handleSave()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete session')

      toast({
        title: 'Session deleted',
        description: 'The session has been removed.',
      })

      onUpdate()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete session. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const addExercise = () => {
    setExercises([...exercises, { 
      name: '', 
      restTime: undefined, 
      notes: undefined,
      sets: [{ setNumber: 1, reps: undefined, load: undefined, rpe: undefined, isDropSet: false, notes: undefined }]
    }])
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
    triggerAutoSave()
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
    triggerAutoSave()
  }

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises]
    const exercise = updated[exerciseIndex]
    const newSetNumber = exercise.sets.length + 1
    updated[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, { setNumber: newSetNumber, reps: undefined, load: undefined, rpe: undefined, isDropSet: false, notes: undefined }]
    }
    setExercises(updated)
    triggerAutoSave()
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises]
    const exercise = updated[exerciseIndex]
    if (exercise.sets.length > 1) {
      updated[exerciseIndex] = {
        ...exercise,
        sets: exercise.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, setNumber: i + 1 }))
      }
      setExercises(updated)
      triggerAutoSave()
    }
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const updated = [...exercises]
    const exercise = updated[exerciseIndex]
    const updatedSets = [...exercise.sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }
    updated[exerciseIndex] = { ...exercise, sets: updatedSets }
    setExercises(updated)
    triggerAutoSave()
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
              <div className="space-y-4">
                {exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                        className="flex-1"
                      />
                      {exercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(exerciseIndex)}
                          className="ml-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    
                    {/* Exercise-level settings */}
                    <div>
                      <Input
                        type="number"
                        placeholder="Rest between sets (sec)"
                        value={exercise.restTime ?? ''}
                        onChange={(e) => updateExercise(exerciseIndex, 'restTime', e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <Input
                      placeholder="Exercise notes (optional)"
                      value={exercise.notes ?? ''}
                      onChange={(e) => updateExercise(exerciseIndex, 'notes', e.target.value)}
                    />

                    {/* Sets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Sets</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          + Add Set
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <span className="text-sm font-medium w-8">#{set.setNumber}</span>
                            <Input
                              type="number"
                              placeholder="Reps"
                              value={set.reps ?? ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value ? Number(e.target.value) : undefined)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="Load (kg)"
                              value={set.load ?? ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'load', e.target.value ? Number(e.target.value) : undefined)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="RPE"
                              min="1"
                              max="10"
                              value={set.rpe ?? ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-16"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={set.isDropSet ?? false}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'isDropSet', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <Label className="text-xs">Drop</Label>
                            </div>
                            {exercise.sets.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="w-8 h-8 p-0"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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

          {/* Delete button */}
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="w-full"
            >
              Delete Session
            </Button>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => handleSave(true)}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
