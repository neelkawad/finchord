'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { useMealPlan, emptyMealPlan, MEAL_PLAN_DAYS, type MealPlan, type DayMeals } from '@/lib/firestore-hooks'
import { cn } from '@/lib/utils'

const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const mealSlots: { key: keyof DayMeals; label: string }[] = [
  { key: 'breakfastLunchbox', label: 'Breakfast & Lunchbox' },
  { key: 'lunchSnack', label: 'Lunch & Snack' },
  { key: 'dinner', label: 'Dinner' },
]

export function WeeklyPlanTab() {
  const { mealPlan, loading } = useMealPlan()
  const [plan, setPlan] = useState<MealPlan>(emptyMealPlan())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (mealPlan) setPlan(mealPlan)
  }, [mealPlan])

  const updateSlot = (day: string, slot: keyof DayMeals, value: string) => {
    setPlan((prev) => ({ ...prev, [day]: { ...prev[day], [slot]: value } }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'households', HOUSEHOLD_ID, 'mealPlan', 'weekly'), plan)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {MEAL_PLAN_DAYS.map((day) => (
          <div key={day} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">{dayLabels[day]}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {mealSlots.map((slot) => (
                <div key={slot.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{slot.label}</label>
                  <input
                    type="text"
                    value={plan[day]?.[slot.key] ?? ''}
                    onChange={(e) => updateSlot(day, slot.key, e.target.value)}
                    placeholder="Not planned"
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            saved ? 'bg-positive text-positive-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          {saved && <Check className="size-4" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save plan'}
        </button>
      </div>
    </div>
  )
}
