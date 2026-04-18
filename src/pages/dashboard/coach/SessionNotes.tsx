import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

interface Note {
  id: string
  note_text: string
  is_private: boolean
  created_at: string
  booking_id: string | null
}

export function SessionNotes() {
  const { id: athleteId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [athleteName, setAthleteName] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [saving, setSaving] = useState(false)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user || !athleteId) return
    fetchData()
  }, [user, athleteId])

  const fetchData = async () => {
    if (!user || !athleteId) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    if (!profileData?.id) { setLoading(false); return }

    const { data: athleteData } = await supabase
      .from('athlete_profiles')
      .select('name')
      .eq('id', athleteId)
      .single()

    setAthleteName(athleteData?.name || 'Athlete')

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
    fetchData()
  }

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from('session_notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="session_notes">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  Notes — {athleteName}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {notes.length} note{notes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard/coach/athletes')}
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                >
                  &larr; Roster
                </button>
              </div>
            </div>

            {/* New Note Form */}
            <Card className="p-5 mb-6">
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
                  Private (not shared with athlete)
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

            {/* Notes List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto" />
              </div>
            ) : notes.length === 0 ? (
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
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                              Private
                            </span>
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
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}