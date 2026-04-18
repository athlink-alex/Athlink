import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

interface VideoSubmission {
  id: string
  athlete_name: string
  title: string
  video_url: string
  coach_feedback: string | null
  feedback_at: string | null
  created_at: string
}

export function OnlineCoaching() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [meetingLink, setMeetingLink] = useState('')
  const [savedLink, setSavedLink] = useState('')
  const [videos, setVideos] = useState<VideoSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({})
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    if (!profileData?.id) { setLoading(false); return }

    // Load meeting link from coach_profiles metadata
    // (stored as a custom field; in practice you'd add a column or use a JSONB field)
    const storedLink = localStorage.getItem(`athlink-meeting-link-${profileData.id}`)
    if (storedLink) setSavedLink(storedLink)

    // Load video submissions
    const { data: videoData } = await supabase
      .from('video_submissions')
      .select(`
        id,
        title,
        video_url,
        coach_feedback,
        feedback_at,
        created_at,
        athlete_profiles (name)
      `)
      .eq('coach_id', profileData.id)
      .order('created_at', { ascending: false })

    if (videoData) {
      setVideos(videoData.map((v: any) => ({
        id: v.id,
        athlete_name: v.athlete_profiles?.name || 'Unknown',
        title: v.title || 'Untitled video',
        video_url: v.video_url,
        coach_feedback: v.coach_feedback,
        feedback_at: v.feedback_at,
        created_at: v.created_at,
      })))
    }

    setLoading(false)
  }

  const handleSaveMeetingLink = () => {
    if (!profile?.id || !meetingLink.trim()) return
    localStorage.setItem(`athlink-meeting-link-${profile.id}`, meetingLink.trim())
    setSavedLink(meetingLink.trim())
    setMeetingLink('')
  }

  const handleRemoveMeetingLink = () => {
    if (!profile?.id) return
    localStorage.removeItem(`athlink-meeting-link-${profile.id}`)
    setSavedLink('')
  }

  const handleSaveFeedback = async (videoId: string) => {
    const text = feedbackText[videoId]?.trim()
    if (!text) return

    setSavingFeedback(videoId)
    await supabase
      .from('video_submissions')
      .update({
        coach_feedback: text,
        feedback_at: new Date().toISOString(),
      })
      .eq('id', videoId)

    setSavingFeedback(null)
    setFeedbackText(prev => {
      const next = { ...prev }
      delete next[videoId]
      return next
    })
    fetchData()
  }

  const pendingVideos = videos.filter(v => !v.coach_feedback)
  const reviewedVideos = videos.filter(v => v.coach_feedback)

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="online_coaching">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Online Coaching</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Meeting links & video review
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/coach')}
              className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              &larr; Dashboard
            </button>
          </div>

          {/* Meeting Link Section */}
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Virtual Meeting Link</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set a default Zoom, Google Meet, or other meeting link for your online sessions.
            </p>

            {savedLink ? (
              <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
                <svg className="w-5 h-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <a
                  href={savedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] truncate flex-1"
                >
                  {savedLink}
                </a>
                <button
                  onClick={handleRemoveMeetingLink}
                  className="text-xs text-[#DC2626] hover:text-red-700 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                />
                <Button size="sm" onClick={handleSaveMeetingLink} disabled={!meetingLink.trim()}>
                  Save
                </Button>
              </div>
            )}
          </Card>

          {/* Video Submissions */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
              Video Submissions ({pendingVideos.length} pending)
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto" />
            </div>
          ) : videos.length === 0 ? (
            <Card className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No video submissions yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Athletes can submit videos for your review after booking an online session.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Pending Reviews */}
              {pendingVideos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#D97706] uppercase tracking-wide mb-2">Pending Review</p>
                  {pendingVideos.map((video) => (
                    <Card key={video.id} className="p-4 mb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{video.athlete_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{video.title} · {new Date(video.created_at).toLocaleDateString()}</p>
                        </div>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                        >
                          View Video
                        </a>
                      </div>
                      <textarea
                        value={feedbackText[video.id] || ''}
                        onChange={(e) => setFeedbackText(prev => ({ ...prev, [video.id]: e.target.value }))}
                        placeholder="Write your feedback..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveFeedback(video.id)}
                          loading={savingFeedback === video.id}
                          disabled={!feedbackText[video.id]?.trim()}
                        >
                          Submit Feedback
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Reviewed Videos */}
              {reviewedVideos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#16A34A] uppercase tracking-wide mb-2">Reviewed</p>
                  {reviewedVideos.map((video) => (
                    <Card key={video.id} className="p-4 mb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{video.athlete_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{video.title} · {new Date(video.created_at).toLocaleDateString()}</p>
                          {video.coach_feedback && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{video.coach_feedback}</p>
                          )}
                        </div>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                        >
                          View
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}