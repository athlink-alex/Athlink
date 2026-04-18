import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import {
  sendChatMessage,
  generateSessionPlan,
  getDrillHistory,
  saveDrillHistory,
  loadChatHistory,
  saveChatMessage,
  clearChatHistory,
  saveSessionPlan,
  loadSessionPlans,
  type ChatMessage,
  type SessionPlan,
  type DrillItem,
} from '../../../lib/aiCoach'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

// ─── Constants ────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Find me 3 drills for bat speed',
  'Best tee drills for a beginner',
  'Arm care routine for pitchers',
  'Fielding drills for infielders',
  'Mental game exercises',
  'Speed and agility for outfielders',
  'Fix a casting swing',
  'Hip rotation drills',
]

const FOCUS_AREAS = [
  'Hitting — Bat Speed',
  'Hitting — Contact & Plate Discipline',
  'Hitting — Power Development',
  'Pitching — Velocity',
  'Pitching — Command & Control',
  'Pitching — Arm Care',
  'Fielding — Ground Balls',
  'Fielding — Footwork',
  'Catching — Blocking & Framing',
  'Speed & Baserunning',
  'Mental Game',
]

const DURATIONS = [30, 45, 60, 90]

const CATEGORY_COLORS: Record<string, string> = {
  hitting: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pitching: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  fielding: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  speed: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  mental: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  warmup: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  cooldown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

// ─── Athlete type ─────────────────────────────────────────

interface AthleteOption {
  id: string
  name: string
  position?: string
  skill_level?: string
  goals?: string
  age?: string
}

// ─── Main Component ───────────────────────────────────────

export function AIAssistant() {
  const { user } = useAuth()
  const [coachProfile, setCoachProfile] = useState<any>(null)
  const [athletes, setAthletes] = useState<AthleteOption[]>([])
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'chat' | 'planner' | 'library'>('chat')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const init = async () => {
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setCoachProfile(profile)

      if (profile?.id) {
        // Get athletes this coach has bookings with
        const { data: bookings } = await supabase
          .from('bookings')
          .select('athlete_id, athlete_profiles(id, name, position, skill_level, goals)')
          .eq('coach_id', profile.id)

        if (bookings) {
          const seen = new Set<string>()
          const athList: AthleteOption[] = []
          for (const b of bookings as any[]) {
            if (b.athlete_profiles && !seen.has(b.athlete_profiles.id)) {
              seen.add(b.athlete_profiles.id)
              athList.push({
                id: b.athlete_profiles.id,
                name: b.athlete_profiles.name,
                position: b.athlete_profiles.position,
                skill_level: b.athlete_profiles.skill_level,
                goals: b.athlete_profiles.goals,
              })
            }
          }
          setAthletes(athList)
          if (athList.length > 0) setSelectedAthleteId(athList[0].id)
        }
      }
      setLoading(false)
    }
    init()
  }, [user])

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId)

  if (loading) {
    return (
      <AppLayout>
        <div className="py-8 px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading AI Assistant...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">AI Coaching Assistant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Web-powered drill search & session planning</p>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden gap-1 mb-4 overflow-x-auto">
          {(['chat', 'planner', 'library'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-[8px] whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab === 'chat' ? 'Chat' : tab === 'planner' ? 'Session Planner' : 'Drill Library'}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar — hidden on mobile */}
          <div className="hidden md:block w-64 flex-shrink-0 space-y-4">
            <Card className="p-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Athlete Context</label>
              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50"
              >
                <option value="">No athlete selected</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {selectedAthlete && (
                <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedAthlete.position && <p>Position: {selectedAthlete.position}</p>}
                  {selectedAthlete.skill_level && <p>Level: {selectedAthlete.skill_level}</p>}
                  {selectedAthlete.goals && <p className="line-clamp-2">Goals: {selectedAthlete.goals}</p>}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Prompts</p>
              <div className="space-y-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setActiveTab('chat')}
                    className="block w-full text-left text-xs px-2.5 py-1.5 rounded-[6px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main area */}
          <div className="flex-1 min-w-0">
            {/* Desktop tabs */}
            <div className="hidden md:flex gap-1 mb-4">
              {(['chat', 'planner', 'library'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-[8px] ${
                    activeTab === tab
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab === 'chat' ? 'Chat' : tab === 'planner' ? 'Session Planner' : 'Drill Library'}
                </button>
              ))}
            </div>

            {activeTab === 'chat' && (
              <ChatTab
                coachProfile={coachProfile}
                selectedAthlete={selectedAthleteId ? selectedAthlete : undefined}
                coachProfileId={coachProfile?.id}
              />
            )}
            {activeTab === 'planner' && (
              <PlannerTab
                coachProfile={coachProfile}
                athletes={athletes}
                selectedAthleteId={selectedAthleteId}
                coachProfileId={coachProfile?.id}
              />
            )}
            {activeTab === 'library' && (
              <LibraryTab
                athletes={athletes}
                selectedAthleteId={selectedAthleteId}
                coachProfileId={coachProfile?.id}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ─── Chat Tab ─────────────────────────────────────────────

function ChatTab({
  coachProfile,
  selectedAthlete,
  coachProfileId,
}: {
  coachProfile: any
  selectedAthlete?: AthleteOption
  coachProfileId?: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!coachProfileId) return
    loadChatHistory(coachProfileId).then(setMessages)
  }, [coachProfileId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setSending(true)

    try {
      if (coachProfileId) {
        await saveChatMessage(coachProfileId, 'user', text, selectedAthlete?.id)
      }

      const reply = await sendChatMessage(updated, coachProfile, selectedAthlete)

      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])

      if (coachProfileId) {
        await saveChatMessage(coachProfileId, 'assistant', reply, selectedAthlete?.id)
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `Couldn't reach AI assistant. ${err instanceof Error ? err.message : 'Please try again.'}`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleClear = async () => {
    if (!coachProfileId) return
    await clearChatHistory(coachProfileId)
    setMessages([])
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  // Extract URLs from assistant messages for source chips
  const extractUrls = (text: string) => {
    const urlRegex = /https?:\/\/[^\s)]+/g
    return text.match(urlRegex) || []
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] dark:border-gray-700">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Chat Assistant</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Web-powered · Real-time drill search</p>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Mobile quick prompts */}
      <div className="md:hidden flex gap-1.5 p-3 overflow-x-auto border-b border-[#E5E7EB] dark:border-gray-700">
        {QUICK_PROMPTS.slice(0, 4).map((p) => (
          <button key={p} onClick={() => handleQuickPrompt(p)} className="text-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] dark:border-gray-700 text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {p.split(' ').slice(0, 4).join(' ')}...
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-sm">Ask me about drills, training methods, or session plans.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-[8px] px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === 'assistant' && extractUrls(msg.content).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {extractUrls(msg.content).slice(0, 3).map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-400 hover:underline"
                    >
                      {new URL(url).hostname}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-[8px] px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching the web for drills...
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-[#E5E7EB] dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask about drills, techniques, training plans..."
            rows={1}
            className="flex-1 px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50 resize-none focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ─── Session Planner Tab ──────────────────────────────────

function PlannerTab({
  coachProfile,
  athletes,
  selectedAthleteId,
  coachProfileId,
}: {
  coachProfile: any
  athletes: AthleteOption[]
  selectedAthleteId: string
  coachProfileId?: string
}) {
  const [focusArea, setFocusArea] = useState('')
  const [customFocus, setCustomFocus] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [athleteId, setAthleteId] = useState(selectedAthleteId)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedAthlete = athletes.find((a) => a.id === athleteId)

  const handleGenerate = async () => {
    if (!coachProfileId || !athleteId || (!focusArea && !customFocus)) return

    setGenerating(true)
    setPlan(null)
    setSaved(false)

    try {
      const drillHist = await getDrillHistory(coachProfileId, athleteId)
      const generated = await generateSessionPlan({
        coachProfile,
        athlete: selectedAthlete || { name: 'Athlete' },
        focusArea: focusArea === 'custom' ? customFocus : focusArea,
        sessionDuration: duration,
        additionalNotes: notes,
        drillHistory: drillHist,
      })
      setPlan(generated)
    } catch (err) {
      alert(`Couldn't generate plan: ${err instanceof Error ? err.message : 'Please try again.'}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!plan || !coachProfileId || !athleteId) return
    setSaving(true)
    try {
      await saveSessionPlan(coachProfileId, athleteId, plan)
      const allDrills = [...plan.warmup, ...plan.mainDrills, ...plan.cooldown]
      await saveDrillHistory(coachProfileId, athleteId, allDrills)
      setSaved(true)
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Session Planner</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Athlete</label>
            <select
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50"
            >
              <option value="">Select athlete</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Focus Area</label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50"
            >
              <option value="">Select focus area</option>
              {FOCUS_AREAS.map((fa) => (
                <option key={fa} value={fa}>{fa}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {focusArea === 'custom' && (
              <input
                type="text"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="e.g., Curveball command"
                className="mt-2 w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 text-sm rounded-[8px] border ${
                    duration === d
                      ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] font-medium'
                      : 'border-[#E5E7EB] dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specifics for this session..."
              rows={3}
              className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50 resize-none"
            />
          </div>

          <Button
            fullWidth
            onClick={handleGenerate}
            disabled={generating || !athleteId || (!focusArea && !customFocus)}
            loading={generating}
          >
            {generating ? 'Generating Plan...' : 'Generate Session Plan'}
          </Button>
        </div>
      </Card>

      {/* Generated plan */}
      <div>
        {generating && !plan && (
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 pt-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {plan && <PlanDisplay plan={plan} onSave={handleSave} saving={saving} saved={saved} />}
      </div>
    </div>
  )
}

// ─── Plan Display ─────────────────────────────────────────

function PlanDisplay({ plan, onSave, saving, saved }: { plan: SessionPlan; onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{plan.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{plan.focusArea} · {plan.duration} min</p>
        </div>
      </div>

      <DrillSection label="WARMUP" drills={plan.warmup} borderColor="border-l-[#16A34A]" />
      <DrillSection label="MAIN DRILLS" drills={plan.mainDrills} borderColor="border-l-[#2563EB]" />
      <DrillSection label="COOLDOWN" drills={plan.cooldown} borderColor="border-l-[#F59E0B]" />

      {plan.coachNotes && (
        <div className="mt-4 p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">COACH NOTES</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{plan.coachNotes}</p>
        </div>
      )}

      {plan.progressionTips && (
        <div className="mt-3 p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">PROGRESSION FOR NEXT SESSION</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{plan.progressionTips}</p>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <Button onClick={onSave} loading={saving} fullWidth>
          {saved ? 'Plan Saved' : 'Save Plan'}
        </Button>
        <Button variant="secondary" onClick={() => window.print()} fullWidth>
          Print / Export
        </Button>
      </div>
    </Card>
  )
}

function DrillSection({ label, drills, borderColor }: { label: string; drills: DrillItem[]; borderColor: string }) {
  return (
    <div className={`border-l-4 ${borderColor} pl-4 mb-4`}>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="space-y-3">
        {drills.map((drill, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-[8px] p-3 border border-[#E5E7EB] dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900 dark:text-gray-50">{drill.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[drill.category] || CATEGORY_COLORS.mental}`}>
                {drill.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{drill.duration} · {drill.reps}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{drill.description}</p>
            {drill.coachingCues.length > 0 && (
              <p className="text-xs text-[#D97706] mt-1">Cues: {drill.coachingCues.join(', ')}</p>
            )}
            {drill.sourceUrl && (
              <a href={drill.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563EB] hover:underline mt-1 inline-block">
                Source
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Drill Library Tab ────────────────────────────────────

function LibraryTab({
  athletes,
  selectedAthleteId,
  coachProfileId,
}: {
  athletes: AthleteOption[]
  selectedAthleteId: string
  coachProfileId?: string
}) {
  const [libAthleteId, setLibAthleteId] = useState(selectedAthleteId)
  const [drills, setDrills] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!coachProfileId) return
    setLoading(true)
    Promise.all([
      loadSessionPlans(coachProfileId),
      libAthleteId ? getDrillHistory(coachProfileId, libAthleteId) : Promise.resolve([]),
    ]).then(([p, d]) => {
      setPlans(p)
      setDrills(d)
      setLoading(false)
    })
  }, [coachProfileId, libAthleteId])

  const isRecent = (dateStr: string) => {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    return diff < 7 * 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-6">
      {/* Saved Session Plans */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Saved Session Plans</h2>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No saved plans yet. Generate one in the Session Planner.</p>
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {plans.map((p: any) => (
              <div key={p.id}>
                <button
                  onClick={() => setExpandedPlan(expandedPlan === p.id ? null : p.id)}
                  className="w-full text-left py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{p.plan_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.athlete_profiles?.name || 'Unknown'} · {p.focus_area} · {p.session_duration} min · {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedPlan === p.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedPlan === p.id && p.plan_content && (
                  <div className="pb-4">
                    <PlanDisplay
                      plan={p.plan_content as SessionPlan}
                      onSave={() => {}}
                      saving={false}
                      saved={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Drill History per Athlete */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Drill History</h2>
          <select
            value={libAthleteId}
            onChange={(e) => setLibAthleteId(e.target.value)}
            className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 dark:text-gray-50"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        ) : drills.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No drills recorded for this athlete yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700">
                  <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Drill</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Used</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Last Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                {drills.map((d: any) => (
                  <tr key={d.id}>
                    <td className="py-2 font-medium text-gray-900 dark:text-gray-50">
                      {d.drill_name}
                      {d.source_url && (
                        <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-[#2563EB] text-xs hover:underline">
                          link
                        </a>
                      )}
                    </td>
                    <td className="py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[d.drill_category] || CATEGORY_COLORS.mental}`}>
                        {d.drill_category}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{d.times_used}x</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {new Date(d.last_used_at).toLocaleDateString()}
                      {isRecent(d.last_used_at) && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-medium">
                          Recent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}