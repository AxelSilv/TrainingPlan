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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Dumbbell, Waves, Target, StretchHorizontal, Activity, Gamepad2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Info } from 'lucide-react'

interface AddSessionDialogProps {
  open: boolean
  onClose: () => void
  selectedDate: Date | null
  existingSessionsCount: number
  onAdd: (data: {
    type: string
    title: string
    plannedRpe?: number
    plannedDuration?: number
    plannedNotes?: string
    runDetails?: { plannedKm?: number; elevationGain?: number; surface?: string }
    swimDetails?: { plannedMeters?: number; sets?: string }
    strengthExercises?: Array<{
      name: string
      sets?: number
      reps?: number
      load?: number
      restTime?: number
      tempo?: string
      rpe?: number
      notes?: string
    }>
  }) => void
}

const sessionTypes = [
  { type: 'mobility', label: 'Mobility', icon: StretchHorizontal, alwaysAvailable: true },
  { type: 'core', label: 'Core Workout', icon: Target, alwaysAvailable: false },
  { type: 'padel', label: 'Padel', icon: Gamepad2, alwaysAvailable: true },
  { type: 'sulis', label: 'Sulkapallo', icon: Gamepad2, alwaysAvailable: true },
  { type: 'futsal', label: 'Futsal', icon: Activity, alwaysAvailable: true },
  { type: 'run', label: 'Run', icon: Activity, alwaysAvailable: true },
  { type: 'swim', label: 'Swim', icon: Waves, alwaysAvailable: true },
  { type: 'strength', label: 'Strength', icon: Dumbbell, alwaysAvailable: true },
  { type: 'custom', label: 'Muu laji (kirjoita itse)', icon: Activity, alwaysAvailable: true, isCustom: true },
]

export function AddSessionDialog({ open, onClose, selectedDate, existingSessionsCount, onAdd }: AddSessionDialogProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [customType, setCustomType] = useState('') // For custom session type
  const [title, setTitle] = useState('')
  const [plannedRpe, setPlannedRpe] = useState(5)
  const [plannedDuration, setPlannedDuration] = useState<number | undefined>(undefined)
  const [plannedNotes, setPlannedNotes] = useState('')
  
  // Run-specific
  const [plannedKm, setPlannedKm] = useState<number | undefined>(undefined)
  const [elevationGain, setElevationGain] = useState<number | undefined>(undefined)
  const [surface, setSurface] = useState<'trail' | 'road' | 'treadmill' | 'indoor'>('road')
  
  // Swim-specific
  const [plannedMeters, setPlannedMeters] = useState<number | undefined>(undefined)
  const [swimSets, setSwimSets] = useState('')
  
  // Strength exercises
  const [exercises, setExercises] = useState<Array<{
    name: string
    sets?: number
    reps?: number
    load?: number
    restTime?: number
    tempo?: string
    rpe?: number
    notes?: string
  }>>([])
  
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setSelectedType(null)
      setCustomType('')
      setTitle('')
      setPlannedRpe(5)
      setPlannedDuration(undefined)
      setPlannedNotes('')
      setPlannedKm(undefined)
      setElevationGain(undefined)
      setSurface('road')
      setPlannedMeters(undefined)
      setSwimSets('')
      setExercises([])
    }
  }, [open])

  const handleTypeSelect = (type: string, defaultLabel: string, isCustom?: boolean) => {
    setSelectedType(type)
    if (isCustom) {
      // For custom type, don't set default title
      setTitle('')
    } else if (!title) {
      setTitle(defaultLabel)
    }
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

  const handleSave = () => {
    if (!selectedDate || !selectedType) {
      toast({
        title: 'Error',
        description: 'Valitse päivä ja treenin tyyppi',
        variant: 'destructive',
      })
      return
    }

    // For custom type, use the custom type name, otherwise use selected type
    const finalType = selectedType === 'custom' ? (customType.toLowerCase().trim() || 'other') : selectedType
    const finalTitle = title || (selectedType === 'custom' ? customType : sessionTypes.find(st => st.type === selectedType)?.label) || 'Session'

    if (selectedType === 'custom' && !customType.trim()) {
      toast({
        title: 'Error',
        description: 'Kirjoita lajin nimi',
        variant: 'destructive',
      })
      return
    }

    const data: any = {
      type: finalType,
      title: finalTitle,
      plannedRpe,
      plannedDuration: plannedDuration || undefined,
      plannedNotes: plannedNotes || undefined,
    }

    if (selectedType === 'run') {
      data.runDetails = {
        plannedKm: plannedKm || undefined,
        elevationGain: elevationGain || undefined,
        surface,
      }
    }

    if (selectedType === 'swim') {
      data.swimDetails = {
        plannedMeters: plannedMeters || undefined,
        sets: swimSets || undefined,
      }
    }

    if (selectedType === 'strength' && exercises.length > 0) {
      data.strengthExercises = exercises.filter(ex => ex.name)
    }

    onAdd(data)
    onClose()
  }

  const availableTypes = sessionTypes.filter(st => 
    st.alwaysAvailable || existingSessionsCount < 2
  )

  const rpeDescription = (rpe: number) => {
    if (rpe <= 2) return 'Erittäin helppo'
    if (rpe <= 4) return 'Helppo'
    if (rpe <= 6) return 'Kohtalainen'
    if (rpe <= 8) return 'Vaikea'
    return 'Erittäin vaikea'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Session</DialogTitle>
          <DialogDescription>
            {selectedDate ? `Add session for ${selectedDate.toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Valitse ensin päivä kalenterista'}
          </DialogDescription>
        </DialogHeader>

        {!selectedDate ? (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Valitse päivä kalenterista klikkaamalla sitä.
            </p>
            <p className="text-xs text-muted-foreground">
              Dialogi avautuu automaattisesti kun valitset päivän.
            </p>
          </div>
        ) : !selectedType ? (
          <div className="space-y-4 py-4">
            <div>
              <Label>Valitse treenin tyyppi</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availableTypes.map((st) => {
                  const Icon = st.icon
                  return (
                    <Button
                      key={st.type}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => handleTypeSelect(st.type, st.label)}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{st.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Type selector (can change) */}
            <div>
              <Label>Treenin tyyppi</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {availableTypes.map((st) => {
                  const Icon = st.icon
                  return (
                    <Button
                      key={st.type}
                      variant={selectedType === st.type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTypeSelect(st.type, st.label, (st as any).isCustom)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {st.label}
                    </Button>
                  )
                })}
              </div>
              
              {/* Custom type input - show when custom is selected */}
              {selectedType === 'custom' && (
                <div className="mt-3">
                  <Label>Lajin nimi</Label>
                  <Input
                    value={customType}
                    onChange={(e) => {
                      setCustomType(e.target.value)
                      if (!title) {
                        setTitle(e.target.value)
                      }
                    }}
                    placeholder="esim. Kiipeily, Pyöräily, CrossFit..."
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label>Otsikko</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Mobility"
                className="mt-2"
              />
            </div>

            {/* RPE */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>RPE: {plannedRpe}</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-popover border rounded-md p-2 text-xs shadow-lg z-50 w-64">
                    <strong>RPE (Rate of Perceived Exertion)</strong>
                    <p className="mt-1">1-10 asteikko kuvaamaan kuinka vaikealta harjoitus tuntuu:</p>
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
                value={[plannedRpe]}
                onValueChange={([value]) => setPlannedRpe(value)}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{rpeDescription(plannedRpe)}</p>
            </div>

            {/* Duration */}
            <div>
              <Label>Kesto (minuutit)</Label>
              <Input
                type="number"
                value={plannedDuration ?? ''}
                onChange={(e) => setPlannedDuration(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Enter duration"
                className="mt-2"
              />
            </div>

            {/* Run-specific */}
            {selectedType === 'run' && (
              <>
                <div>
                  <Label>Etäisyys (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={plannedKm ?? ''}
                    onChange={(e) => setPlannedKm(e.target.value ? Number(e.target.value) : undefined)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Nousu (metrit)</Label>
                  <Input
                    type="number"
                    value={elevationGain ?? ''}
                    onChange={(e) => setElevationGain(e.target.value ? Number(e.target.value) : undefined)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Pinta</Label>
                  <select
                    value={surface}
                    onChange={(e) => setSurface(e.target.value as any)}
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                  >
                    <option value="road">Road</option>
                    <option value="trail">Trail</option>
                    <option value="treadmill">Treadmill</option>
                    <option value="indoor">Indoor</option>
                  </select>
                </div>
              </>
            )}

            {/* Swim-specific */}
            {selectedType === 'swim' && (
              <>
                <div>
                  <Label>Etäisyys (metrit)</Label>
                  <Input
                    type="number"
                    value={plannedMeters ?? ''}
                    onChange={(e) => setPlannedMeters(e.target.value ? Number(e.target.value) : undefined)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Sets / Drills</Label>
                  <textarea
                    value={swimSets}
                    onChange={(e) => setSwimSets(e.target.value)}
                    className="w-full mt-2 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., 200 warm-up, 4x50 drill, 4x100 easy"
                  />
                </div>
              </>
            )}

            {/* Strength exercises */}
            {selectedType === 'strength' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Liikkeet</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                    + Lisää liike
                  </Button>
                </div>
                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Liikkeen nimi"
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
                          placeholder="Paino (kg)"
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
                          placeholder="Lepo (sek)"
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
                        placeholder="Muistiinpanot (valinnainen)"
                        value={exercise.notes ?? ''}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      />
                    </div>
                  ))}
                  {exercises.length === 0 && (
                    <Button type="button" variant="outline" onClick={addExercise} className="w-full">
                      + Lisää ensimmäinen liike
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Muistiinpanot</Label>
              <textarea
                value={plannedNotes}
                onChange={(e) => setPlannedNotes(e.target.value)}
                className="w-full mt-2 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Lisää muistiinpanot..."
              />
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Peruuta
              </Button>
              <Button onClick={handleSave}>
                Lisää treeni
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
