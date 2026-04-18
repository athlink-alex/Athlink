import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type SessionReport } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { StarRating } from '../../../components/ui/StarRating'
import { SessionReportCard } from '../../../components/SessionReportCard'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

type TabId = 'overview' | 'history' | 'notes'

interface AthleteInfo {
  id: string
  name: string
  sport: string | null
  position: string | null
  skill_level: string | null
  goals: string | null
  photo_url: string | null
}

interface Note {
  id: string
  note_text: string
  is_private: boolean
  created_at: string
}

export function AthleteDetail() {
  const { id: athleteId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [athlete, setAthlete] = useState<AthleteInfo | null>(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [reports, setReports] = useState<SessionReport[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [saving, setSaving] = useState(false)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user || !athleteId) return
    fetchAll()
  }, [user, athleteId])

  const fetchAll = async () => {
    if (!user || !athleteId) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    if (!profileData?.id) { setLoading(false); return }

    // Athlete profile
    const { data: athleteData } = await supabase
      .from('athlete_profiles')
      .select('id, name, sport, position, skill_level, goals, photo_url')
      .eq('id', athleteId)
      .single()

    setAthlete(athleteData as AthleteInfo | null)

    // Session count
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', profileData.id)
      .eq('athlete_id', athleteId)

    setSessionCount(count || 0)

    // Session reports
    const { data: reportsData } = await supabase
      .from('session_reports')
      .select('*')
      .eq('coach_id', profileData.id)
      .eq('athlete_id', athleteId)
      .order('session_date', { ascending: false })

    setReports((reportsData || []) as SessionReport[])

    // Notes
    const { data: notesData } = await supabase
      .from('session_notes')
      .select('*')
      .eq('coach_id', profileData.id)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    setNotes((notesData || []) as Note[])

    setLoading(false)
  }

  const handleSaveNote = async () => {
    if (!newNote.trim() || !profile?.id || !athleteId) return
    setSaving(true)

    await supabase.from('session_notes').insert({
      coach_id: profile.id,
      athlete_id: athleteId,
      note_text: newNote.trim(),
      is_private: isPrivate,
    })

    setNewNote('')
    setSaving(false)
    fetchAll()
  }

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from('session_notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  // Build AI assistant prompt
  const latestObjective = reports[0]?.next_session_objective
  const aiPrompt = athlete
    ? `Help me plan a session for ${athlete.name}, ${athlete.position || 'athlete'}, ${athlete.skill_level || 'intermediate'}. Last session objective was: ${latestObjective || 'N/A'}. Build on that.`
    : ''

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Session History' },
    { id: 'notes', label: 'Notes' },
  ]

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="session_notes">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <button
              onClick={() => navigate('/dashboard/coach/athletes')}
              className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium mb-4"
            >
              &larr; My Athletes
            </button>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              </div>
            ) : !athlete ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Athlete not found.</p>
              </Card>
            ) : (
              <>
                {/* Athlete Header */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar src={athlete.photo_url} name={athlete.name} size="xl" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      {athlete.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {athlete.sport}{athlete.position ? ` · ${athlete.position}` : ''}{athlete.skill_level ? ` · ${athlete.skill_level}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {sessionCount} session{sessionCount !== 1 ? 's' : ''} together
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-[#E5E7EB] dark:border-gray-700 mb-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-[#2563EB] text-[#2563EB]'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <Card className="p-5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Profile</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Sport</span>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{athlete.sport || '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Position</span>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{athlete.position || '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Skill Level</span>
                          <p className="font-medium text-gray-900 dark:text-gray-50 capitalize">{athlete.skill_level || '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Sessions</span>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{sessionCount}</p>
                        </div>
                      </div>
                      {athlete.goals && (
                        <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Goals</span>
                          <p className="text-sm text-gray-900 dark:text-gray-50 mt-1">{athlete.goals}</p>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* Tab: Session History */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {/* Prepare for next session */}
                    {reports.length > 0 && (
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                          {reports.length} session{reports.length !== 1 ? 's' : ''} total
                        </h3>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/dashboard/coach/assistant?prompt=${encodeURIComponent(aiPrompt)}`)}
                        >
                          Prepare for Next Session
                        </Button>
                      </div>
                    )}

                    {reports.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No session reports yet for this athlete.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((report) => {
                          const isExpanded = expandedReport === report.id
                          const dateStr = new Date(report.session_date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })

                          return (
                            <Card key={report.id} className="p-4 sm:p-5">
                              <div
                                className="cursor-pointer"
                                onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                    {dateStr}
                                  </span>
                                  {report.session_rating && (
                                    <StarRating value={report.session_rating} readonly size="sm" />
                                  )}
                                </div>
                                {report.session_summary && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                    {report.session_summary}
                                  </p>
                                )}
                                {report.next_session_objective && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Next Objective: "{report.next_session_objective}"
                                  </p>
                                )}
                              </div>

                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
                                  <SessionReportCard report={report} />
                                </div>
                              )}

                              {!isExpanded && (
                                <button
                                  onClick={() => setExpandedReport(report.id)}
                                  className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium mt-2"
                                >
                                  View Full Report ↓
                                </button>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Notes */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {/* New Note Form */}
                    <Card className="p-5">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a session note..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          Private
                        </label>
                        <Button
                          size="sm"
                          onClick={handleSaveNote}
                          loading={saving}
                          disabled={!newNote.trim()}
                        >
                          Save Note
                        </Button>
                      </div>
                    </Card>

                    {notes.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No notes yet for this athlete.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <Card key={note.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-gray-50 whitespace-pre-wrap">{note.note_text}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {new Date(note.created_at).toLocaleDateString()}
                                  </span>
                                  {note.is_private && (
                                    <Badge status="pending">Private</Badge>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-xs text-[#DC2626] hover:text-red-700 flex-shrink-0"
                              >
                                Delete
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}