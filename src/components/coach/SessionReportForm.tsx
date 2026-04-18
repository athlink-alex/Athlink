import { useState, useEffect, useCallback } from 'react'
import { supabase, type SessionReport } from '../../lib/supabase'
import { StarRating } from '../ui/StarRating'
import { Button } from '../ui/Button'

interface SessionReportFormProps {
  bookingId: string
  athleteId: string
  coachId: string
  athleteName: string
  athletePosition?: string | null
  sessionDate: string
  existingReport?: SessionReport | null
  onSave: (report: SessionReport) => void
  onClose: () => void
}

interface DrillRow {
  name: string
  frequency: string
}

const DRAFT_KEY = (bookingId: string) => `session_report_draft_${bookingId}`

export function SessionReportForm({
  bookingId,
  athleteId,
  coachId,
  athleteName,
  athletePosition,
  sessionDate,
  existingReport,
  onSave,
  onClose,
}: SessionReportFormProps) {
  const [rating, setRating] = useState(existingReport?.session_rating || 0)
  const [summary, setSummary] = useState(existingReport?.session_summary || '')
  const [strength1, setStrength1] = useState(existingReport?.strength_1 || '')
  const [strength2, setStrength2] = useState(existingReport?.strength_2 || '')
  const [strength3, setStrength3] = useState(existingReport?.strength_3 || '')
  const [improvement1, setImprovement1] = useState(existingReport?.improvement_1 || '')
  const [improvement2, setImprovement2] = useState(existingReport?.improvement_2 || '')
  const [improvement3, setImprovement3] = useState(existingReport?.improvement_3 || '')
  const [drills, setDrills] = useState<DrillRow[]>(
    existingReport
      ? [
          { name: existingReport.drill_1_name || '', frequency: existingReport.drill_1_frequency || '' },
          { name: existingReport.drill_2_name || '', frequency: existingReport.drill_2_frequency || '' },
          { name: existingReport.drill_3_name || '', frequency: existingReport.drill_3_frequency || '' },
        ].filter(d => d.name)
      : [{ name: '', frequency: '' }, { name: '', frequency: '' }, { name: '', frequency: '' }]
  )
  const [objective, setObjective] = useState(existingReport?.next_session_objective || '')
  const [saving, setSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [toast, setToast] = useState('')

  // Session count
  const [sessionCount, setSessionCount] = useState(0)

  useEffect(() => {
    const fetchSessionCount = async () => {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('athlete_id', athleteId)
      setSessionCount(count || 0)
    }
    fetchSessionCount()
  }, [coachId, athleteId])

  // Auto-save draft every 20 seconds
  const saveDraft = useCallback(() => {
    const draft = {
      rating,
      summary,
      strength1, strength2, strength3,
      improvement1, improvement2, improvement3,
      drills,
      objective,
    }
    localStorage.setItem(DRAFT_KEY(bookingId), JSON.stringify(draft))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }, [bookingId, rating, summary, strength1, strength2, strength3, improvement1, improvement2, improvement3, drills, objective])

  useEffect(() => {
    // Load draft if no existing report
    if (!existingReport) {
      const saved = localStorage.getItem(DRAFT_KEY(bookingId))
      if (saved) {
        try {
          const draft = JSON.parse(saved)
          if (draft.rating) setRating(draft.rating)
          if (draft.summary) setSummary(draft.summary)
          if (draft.strength1) setStrength1(draft.strength1)
          if (draft.strength2) setStrength2(draft.strength2)
          if (draft.strength3) setStrength3(draft.strength3)
          if (draft.improvement1) setImprovement1(draft.improvement1)
          if (draft.improvement2) setImprovement2(draft.improvement2)
          if (draft.improvement3) setImprovement3(draft.improvement3)
          if (draft.drills) setDrills(draft.drills)
          if (draft.objective) setObjective(draft.objective)
        } catch {}
      }
    }

    const interval = setInterval(saveDraft, 20000)
    return () => clearInterval(interval)
  }, [bookingId, existingReport, saveDraft])

  const addDrill = () => {
    if (drills.length < 5) {
      setDrills([...drills, { name: '', frequency: '' }])
    }
  }

  const removeDrill = (index: number) => {
    setDrills(drills.filter((_, i) => i !== index))
  }

  const updateDrill = (index: number, field: 'name' | 'frequency', value: string) => {
    const updated = [...drills]
    updated[index] = { ...updated[index], [field]: value }
    setDrills(updated)
  }

  const isValid = rating > 0 && summary.trim() && strength1.trim() && improvement1.trim() && objective.trim()

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)

    try {
      const reportData = {
        coach_id: coachId,
        athlete_id: athleteId,
        booking_id: bookingId,
        session_date: sessionDate,
        session_summary: summary.trim(),
        strength_1: strength1.trim() || null,
        strength_2: strength2.trim() || null,
        strength_3: strength3.trim() || null,
        improvement_1: improvement1.trim() || null,
        improvement_2: improvement2.trim() || null,
        improvement_3: improvement3.trim() || null,
        drill_1_name: drills[0]?.name?.trim() || null,
        drill_1_frequency: drills[0]?.frequency?.trim() || null,
        drill_2_name: drills[1]?.name?.trim() || null,
        drill_2_frequency: drills[1]?.frequency?.trim() || null,
        drill_3_name: drills[2]?.name?.trim() || null,
        drill_3_frequency: drills[2]?.frequency?.trim() || null,
        next_session_objective: objective.trim(),
        session_rating: rating,
        is_visible_to_athlete: true,
      }

      let result
      if (existingReport) {
        const { data, error } = await supabase
          .from('session_reports')
          .update({ ...reportData, updated_at: new Date().toISOString() })
          .eq('id', existingReport.id)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('session_reports')
          .insert(reportData)
          .select()
          .single()
        if (error) throw error
        result = data
      }

      // Clear draft
      localStorage.removeItem(DRAFT_KEY(bookingId))

      setToast(`Report saved — ${athleteName} can now see this report`)
      setTimeout(() => {
        onSave(result as SessionReport)
      }, 1500)
    } catch (err) {
      console.error('Error saving report:', err)
      setToast('Error saving report. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const dateStr = new Date(sessionDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-6 space-y-6">
      {/* Success Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-[8px] bg-[#16A34A] text-white text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">Athlete</p>
        <p className="font-semibold text-gray-900 dark:text-gray-50">{athleteName}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>Session Date: {dateStr}</span>
          {athletePosition && <span>· {athletePosition}</span>}
          <span>· Session #{sessionCount} together</span>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
          How would you rate today's session overall?
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Section 1 — Session Summary */}
      <div className="border-l-4 border-[#2563EB] pl-3">
        <label className="block text-sm font-semibold text-[#2563EB] uppercase tracking-wider">
          Session Summary
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
          What did you cover today? Give a brief overview of the session.
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="e.g. Focused on lower half mechanics in the swing. Worked through tee drills, front toss, and live BP. Finished with baserunning reads."
          className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors resize-none"
        />
      </div>

      {/* Section 2 — Strengths */}
      <div className="border-l-4 border-[#16A34A] pl-3">
        <label className="block text-sm font-semibold text-[#16A34A] uppercase tracking-wider">
          Strengths Observed
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
          What did this athlete execute well today?
        </p>
        <div className="space-y-2">
          <input
            type="text"
            value={strength1}
            onChange={(e) => setStrength1(e.target.value)}
            placeholder="e.g. Exceptional hip load — creating great separation before contact"
            className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
          <input
            type="text"
            value={strength2}
            onChange={(e) => setStrength2(e.target.value)}
            placeholder="e.g. Took coaching cues immediately and self-corrected mid-drill"
            className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
          <input
            type="text"
            value={strength3}
            onChange={(e) => setStrength3(e.target.value)}
            placeholder="Optional third strength"
            className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
        </div>
      </div>

      {/* Section 3 — Development Areas */}
      <div className="border-l-4 border-[#D97706] pl-3">
        <label className="block text-sm font-semibold text-[#D97706] uppercase tracking-wider">
          Development Areas
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
          What should this athlete continue working on?
        </p>
        <div className="space-y-2">
          <input
            type="text"
            value={improvement1}
            onChange={(e) => setImprovement1(e.target.value)}
            placeholder="e.g. Arm bar at contact — losing extension through the zone"
            className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
          <input
            type="text"
            value={improvement2}
            onChange={(e) => setImprovement2(e.target.value)}
            placeholder="e.g. Pitch recognition on offspeed — chasing low and away"
            className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
          <input
            type="text"
            value={improvement3}
            onChange={(e) => setImprovement3(e.target.value)}
            placeholder="Optional third area"
            className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
        </div>
      </div>

      {/* Section 4 — Drill Plan */}
      <div className="border-l-4 border-[#7C3AED] pl-3">
        <label className="block text-sm font-semibold text-[#7C3AED] uppercase tracking-wider">
          Next Session Drill Plan
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
          Assign specific drills for the athlete to work on before the next session.
        </p>
        <div className="space-y-2">
          {drills.map((drill, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={drill.name}
                onChange={(e) => updateDrill(i, 'name', e.target.value)}
                placeholder="e.g. Tee work — hip rotation focus"
                className="flex-1 px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
              <input
                type="text"
                value={drill.frequency}
                onChange={(e) => updateDrill(i, 'frequency', e.target.value)}
                placeholder="e.g. 10 min daily"
                className="w-32 px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
              />
              {drills.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDrill(i)}
                  className="p-1.5 rounded-[8px] hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-[#DC2626] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {drills.length < 5 && (
            <button
              type="button"
              onClick={addDrill}
              className="text-sm text-[#7C3AED] hover:text-[#6D28D9] font-medium mt-1"
            >
              + Add Drill
            </button>
          )}
        </div>
      </div>

      {/* Section 5 — Next Session Objective */}
      <div className="border-l-4 border-[#2563EB] pl-3">
        <label className="block text-sm font-semibold text-[#2563EB] uppercase tracking-wider">
          Next Session Objective
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
          What is the primary goal you want to accomplish in the next session?
        </p>
        <input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="e.g. Build on today's hip work — move to front toss and measure if separation improvement carries into live pitching"
          className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
        />
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#E5E7EB] dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {draftSaved ? 'Draft saved ✓' : 'Auto-saves every 20s'}
          </span>
          {!isValid && (
            <span className="text-xs text-[#D97706]">
              Required: Rating, Summary, Strength 1, Improvement 1, Objective
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={saveDraft}
            className="flex-shrink-0"
          >
            Save Draft
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!isValid}
            fullWidth
          >
            Save Report
          </Button>
        </div>
      </div>
    </div>
  )
}