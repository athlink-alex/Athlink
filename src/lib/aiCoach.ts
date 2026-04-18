import { supabase, EDGE_FUNCTION_BASE } from './supabase'

// ─── TYPES ───────────────────────────────────────────────

export interface DrillItem {
  name: string
  category: string
  duration: string
  reps: string
  description: string
  coachingCues: string[]
  sourceUrl?: string
}

export interface SessionPlan {
  title: string
  focusArea: string
  duration: number
  warmup: DrillItem[]
  mainDrills: DrillItem[]
  cooldown: DrillItem[]
  coachNotes: string
  progressionTips: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── EDGE FUNCTION HELPER ─────────────────────────────────

async function callAI(params: {
  system: string
  messages: { role: string; content: string }[]
  max_tokens?: number
}): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(`${EDGE_FUNCTION_BASE}/ai-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      type: 'chat',
      system: params.system,
      messages: params.messages,
      max_tokens: params.max_tokens || 1500,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `AI request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.content
}

// ─── DRILL HISTORY HELPERS ────────────────────────────────

export async function getDrillHistory(coachId: string, athleteId: string) {
  const { data } = await supabase
    .from('drill_history')
    .select('id, drill_name, drill_category, times_used, last_used_at, source_url')
    .eq('coach_id', coachId)
    .eq('athlete_id', athleteId)
    .order('last_used_at', { ascending: false })
  return data || []
}

export async function saveDrillHistory(
  coachId: string,
  athleteId: string,
  drills: DrillItem[]
) {
  for (const drill of drills) {
    const { data: existing } = await supabase
      .from('drill_history')
      .select('id, times_used')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .eq('drill_name', drill.name)
      .single()

    if (existing) {
      await supabase
        .from('drill_history')
        .update({
          times_used: existing.times_used + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('drill_history').insert({
        coach_id: coachId,
        athlete_id: athleteId,
        drill_name: drill.name,
        drill_category: drill.category,
        drill_description: drill.description,
        source_url: drill.sourceUrl || null,
        times_used: 1,
      })
    }
  }
}

// ─── CHAT ASSISTANT ───────────────────────────────────────

export async function sendChatMessage(
  messages: ChatMessage[],
  coachProfile: { name: string; sport: string; specialty?: string },
  athleteContext?: { name: string; age?: string; position?: string; skill_level?: string; goals?: string }
): Promise<string> {
  const systemPrompt = `You are an expert baseball coaching assistant for ${coachProfile.name},
a ${coachProfile.sport} coach on Athlink${coachProfile.specialty ? ` specializing in ${coachProfile.specialty}` : ''}.

Your job is to help coaches find specific drills, exercises, and training resources for their athletes.
You have access to web search — use it to find current, specific, real-world drills and resources.
Always search the web when asked about specific drills, techniques, or training methods.

${athleteContext ? `Current athlete context:
- Name: ${athleteContext.name}
- Position: ${athleteContext.position || 'unknown'}
- Skill level: ${athleteContext.skill_level || 'unknown'}
- Goals: ${athleteContext.goals || 'general improvement'}` : ''}

When recommending drills:
- Be specific with reps, sets, and duration
- Include coaching cues (what to look for, what to correct)
- Cite sources when possible (YouTube videos, coaching articles)
- Explain WHY each drill helps with the stated goal
- Keep it practical and immediately usable

You are direct, knowledgeable, and focused on results.`

  return callAI({
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}

// ─── SESSION PLAN GENERATOR ───────────────────────────────

export async function generateSessionPlan(params: {
  coachProfile: { name: string; sport: string; specialty?: string }
  athlete: { name: string; position?: string; skill_level?: string; goals?: string }
  focusArea: string
  sessionDuration: number
  additionalNotes: string
  drillHistory: { drill_name: string; times_used: number; last_used_at: string }[]
}): Promise<SessionPlan> {
  const { coachProfile, athlete, focusArea, sessionDuration, additionalNotes, drillHistory } = params

  const recentDrills = drillHistory
    .slice(0, 15)
    .map((d) => `${d.drill_name} (used ${d.times_used}x, last: ${new Date(d.last_used_at).toLocaleDateString()})`)
    .join('\n')

  const systemPrompt = `You are an expert baseball training session planner.
You create structured, progressive training sessions for baseball players.
You have access to web search — use it to find specific, current drills for the requested focus area.

CRITICAL RULE — DRILL ROTATION:
The following drills have been recently used with this athlete.
DO NOT repeat any drill used in the last 2 weeks unless absolutely necessary.
Vary the drills to keep training fresh and progressive:

Recently used drills:
${recentDrills || 'No history yet — this is the first session'}

Always respond with ONLY a valid JSON object matching this exact structure (no markdown fences, no extra text):
{
  "title": "session title",
  "focusArea": "what this session focuses on",
  "duration": number in minutes,
  "warmup": [{"name":"drill name","category":"warmup","duration":"X min","reps":"X reps","description":"what the drill is","coachingCues":["cue 1","cue 2"],"sourceUrl":null}],
  "mainDrills": [{"name":"drill name","category":"hitting|pitching|fielding|speed|mental","duration":"X min","reps":"X reps / X sets","description":"what the drill is","coachingCues":["cue 1"],"sourceUrl":"url or null"}],
  "cooldown": [{"name":"drill name","category":"cooldown","duration":"X min","reps":"X reps","description":"description","coachingCues":["cue"],"sourceUrl":null}],
  "coachNotes": "overall notes for this session",
  "progressionTips": "how to progress this next session"
}

Search the web for real, specific drills. Do not make up generic drills.`

  const userPrompt = `Create a ${sessionDuration}-minute baseball training session for:
Athlete: ${athlete.name}
Position: ${athlete.position || 'unknown'}
Skill level: ${athlete.skill_level || 'unknown'}
Goals: ${athlete.goals || 'general improvement'}
Focus area: ${focusArea}
Additional notes: ${additionalNotes || 'None'}
Coach specialty: ${coachProfile.specialty || coachProfile.sport}
Search for specific drills targeting ${focusArea} for a ${athlete.skill_level || 'intermediate'} ${athlete.position || 'player'}.
Return a complete structured session plan as JSON.`

  const textContent = await callAI({
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 2000,
  })

  const clean = textContent.replace(/```json|```/g, '').trim()
  const plan: SessionPlan = JSON.parse(clean)
  return plan
}

// ─── CHAT HISTORY PERSISTENCE ─────────────────────────────

export async function loadChatHistory(coachId: string, limit = 20) {
  const { data } = await supabase
    .from('ai_chat_history')
    .select('role, content, created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })
    .limit(limit)
  return (data || []) as ChatMessage[]
}

export async function saveChatMessage(coachId: string, role: 'user' | 'assistant', content: string, athleteId?: string) {
  await supabase.from('ai_chat_history').insert({
    coach_id: coachId,
    athlete_id: athleteId || null,
    role,
    content,
  })
}

export async function clearChatHistory(coachId: string) {
  await supabase.from('ai_chat_history').delete().eq('coach_id', coachId)
}

// ─── SESSION PLAN PERSISTENCE ─────────────────────────────

export async function saveSessionPlan(
  coachId: string,
  athleteId: string,
  plan: SessionPlan
) {
  await supabase.from('session_plans').insert({
    coach_id: coachId,
    athlete_id: athleteId,
    plan_title: plan.title,
    focus_area: plan.focusArea,
    session_duration: plan.duration,
    plan_content: plan,
    drills_used: [...plan.warmup, ...plan.mainDrills, ...plan.cooldown].map((d) => d.name),
  })
}

export async function loadSessionPlans(coachId: string) {
  const { data } = await supabase
    .from('session_plans')
    .select('id, plan_title, focus_area, session_duration, drills_used, created_at, athlete_id, athlete_profiles(name)')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data || []
}

// ─── PROGRESS REPORT GENERATOR ──────────────────────────────

export interface ProgressReportResult {
  title: string
  summary: string
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  period_start: string
  period_end: string
}

export async function generateProgressReport(params: {
  coachId: string
  coachName: string
  coachSport: string
  athleteId: string
  athleteName: string
}): Promise<ProgressReportResult> {
  const { coachId, coachName, coachSport, athleteId, athleteName } = params

  // Gather context: recent bookings, drill history, session plans
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const periodEnd = now.toISOString().split('T')[0]

  const [bookingsRes, drillRes, plansRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('status, session_date, amount')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .order('session_date', { ascending: false })
      .limit(20),
    supabase
      .from('drill_history')
      .select('drill_name, drill_category, times_used, last_used_at')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .order('last_used_at', { ascending: false })
      .limit(10),
    supabase
      .from('session_plans')
      .select('plan_title, focus_area, created_at')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const bookings = bookingsRes.data || []
  const drills = drillRes.data || []
  const plans = plansRes.data || []

  const completedBookings = bookings.filter((b: any) => b.status === 'completed')
  const totalSessions = completedBookings.length

  const systemPrompt = `You are an expert ${coachSport} coach writing a progress report for a coach named ${coachName}.

Based on the data below, generate a structured progress report for athlete ${athleteName}.

SESSION DATA:
- Total sessions: ${totalSessions}
- Period: ${periodStart} to ${periodEnd}
${bookings.length > 0 ? `- Recent sessions: ${bookings.slice(0, 10).map((b: any) => `${b.session_date} (${b.status})`).join(', ')}` : '- No session data available'}

DRILL HISTORY:
${drills.length > 0 ? drills.map((d: any) => `- ${d.drill_name} (${d.drill_category}, used ${d.times_used}x)`).join('\n') : 'No drill history available'}

SESSION PLANS:
${plans.length > 0 ? plans.map((p: any) => `- ${p.plan_title} (focus: ${p.focus_area})`).join('\n') : 'No session plans available'}

Always respond with ONLY a valid JSON object matching this exact structure (no markdown fences, no extra text):
{
  "title": "progress report title",
  "summary": "2-3 sentence overview of the athlete's progress",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areas_for_improvement": ["area 1", "area 2", "area 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"],
  "period_start": "${periodStart}",
  "period_end": "${periodEnd}"
}

Be encouraging but honest. Use specific data when available. Keep items concise (1-2 sentences each).`

  const textContent = await callAI({
    system: systemPrompt,
    messages: [{ role: 'user', content: `Generate a progress report for ${athleteName}.` }],
  })

  const clean = textContent.replace(/```json|```/g, '').trim()
  const report: ProgressReportResult = JSON.parse(clean)
  return report
}