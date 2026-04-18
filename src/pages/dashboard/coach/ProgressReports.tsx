import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'
import { generateProgressReport } from '../../../lib/aiCoach'

interface Report {
  id: string
  athlete_id: string
  athlete_name: string
  title: string
  summary: string
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  is_shared: boolean
  share_token: string
  period_start: string | null
  period_end: string | null
  created_at: string
}

interface AthleteOption {
  id: string
  name: string
}

export function ProgressReports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [athletes, setAthletes] = useState<AthleteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState('')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, name, sport, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    if (!profileData?.id) { setLoading(false); return }

    // Fetch roster athletes
    const { data: rosterData } = await supabase
      .from('athlete_roster')
      .select(`
        athlete_id,
        athlete_profiles (id, name)
      `)
      .eq('coach_id', profileData.id)

    if (rosterData) {
      setAthletes(rosterData.map((r: any) => ({
        id: r.athlete_profiles?.id || r.athlete_id,
        name: r.athlete_profiles?.name || 'Unknown',
      })))
    }

    // Fetch reports
    const { data: reportsData } = await supabase
      .from('progress_reports')
      .select(`
        id,
        athlete_id,
        title,
        summary,
        strengths,
        areas_for_improvement,
        recommendations,
        is_shared,
        share_token,
        period_start,
        period_end,
        created_at,
        athlete_profiles (name)
      `)
      .eq('coach_id', profileData.id)
      .order('created_at', { ascending: false })

    if (reportsData) {
      setReports(reportsData.map((r: any) => ({
        id: r.id,
        athlete_id: r.athlete_id,
        athlete_name: r.athlete_profiles?.name || 'Unknown',
        title: r.title,
        summary: r.summary,
        strengths: r.strengths || [],
        areas_for_improvement: r.areas_for_improvement || [],
        recommendations: r.recommendations || [],
        is_shared: r.is_shared,
        share_token: r.share_token,
        period_start: r.period_start,
        period_end: r.period_end,
        created_at: r.created_at,
      })))
    }

    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!selectedAthlete || !profile?.id || !user) return
    setGenerating(true)

    try {
      const athlete = athletes.find(a => a.id === selectedAthlete)
      const athleteName = athlete?.name || 'Athlete'

      const result = await generateProgressReport({
        coachId: profile.id,
        coachName: profile.name,
        coachSport: profile.sport,
        athleteId: selectedAthlete,
        athleteName,
      })

      // Save report
      await supabase.from('progress_reports').insert({
        coach_id: profile.id,
        athlete_id: selectedAthlete,
        title: result.title,
        summary: result.summary,
        strengths: result.strengths,
        areas_for_improvement: result.areas_for_improvement,
        recommendations: result.recommendations,
        period_start: result.period_start,
        period_end: result.period_end,
      })

      setShowForm(false)
      setSelectedAthlete('')
      fetchData()
    } catch (err) {
      console.error('Error generating report:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleShare = async (reportId: string, shareToken: string, isShared: boolean) => {
    await supabase
      .from('progress_reports')
      .update({ is_shared: !isShared })
      .eq('id', reportId)

    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, is_shared: !isShared } : r
    ))
  }

  const shareUrl = (token: string) => `${window.location.origin}/reports/${token}`

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="progress_reports" overlay>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Progress Reports</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-generated athlete reports</p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                Generate Report
              </Button>
              <button
                onClick={() => navigate('/dashboard/coach')}
                className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
              >
                &larr; Dashboard
              </button>
            </div>
          </div>

          {/* Generate Form */}
          {showForm && (
            <Card className="p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">Generate New Report</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedAthlete}
                  onChange={(e) => setSelectedAthlete(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                >
                  <option value="">Select an athlete...</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  disabled={!selectedAthlete}
                >
                  {generating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
            </Card>
          )}

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No reports yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Generate your first AI-powered progress report.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                    className="w-full p-5 text-left hover:bg-[#F9FAFB] dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-50">{report.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {report.athlete_name} · {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedReport === report.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {expandedReport === report.id && (
                    <div className="px-5 pb-5 border-t border-[#E5E7EB] dark:border-gray-700">
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-gray-50 whitespace-pre-wrap">{report.summary}</p>
                        </div>

                        {report.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#16A34A] uppercase tracking-wide mb-1">Strengths</p>
                            <ul className="space-y-1">
                              {report.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-[#16A34A] mt-0.5">&#10003;</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.areas_for_improvement.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#D97706] uppercase tracking-wide mb-1">Areas for Improvement</p>
                            <ul className="space-y-1">
                              {report.areas_for_improvement.map((a, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-[#D97706] mt-0.5">&#9650;</span>
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.recommendations.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide mb-1">Recommendations</p>
                            <ul className="space-y-1">
                              {report.recommendations.map((r, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-[#2563EB] mt-0.5">&#8594;</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-gray-700 flex items-center gap-3">
                        <button
                          onClick={() => handleToggleShare(report.id, report.share_token, report.is_shared)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                            report.is_shared
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {report.is_shared ? 'Shared' : 'Share'}
                        </button>
                        {report.is_shared && (
                          <button
                            onClick={() => navigator.clipboard.writeText(shareUrl(report.share_token))}
                            className="text-xs text-[#2563EB] hover:text-[#1d4ed8]"
                          >
                            Copy share link
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}