import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function PublicReport() {
  const params = useParams()
  const token = params.token
  const [report, setReport] = useState<any>(null)
  const [athleteName, setAthleteName] = useState('')
  const [coachName, setCoachName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetchReport()
  }, [token])

  async function fetchReport() {
    try {
      const { data, error: fetchError } = await supabase
        .from('session_reports')
        .select('*')
        .eq('share_token', token)
        .single()

      if (fetchError || !data) {
        setError('Report not found or has been removed.')
        return
      }

      setReport(data)

      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('name')
        .eq('user_id', data.athlete_id)
        .single()
      if (athlete) setAthleteName(athlete.name)

      const { data: coach } = await supabase
        .from('coach_profiles')
        .select('name')
        .eq('user_id', data.coach_id)
        .single()
      if (coach) setCoachName(coach.name)
    } catch {
      setError('Failed to load report.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-400">Loading report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Session Report
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {athleteName} with {coachName}
        </p>

        {report.session_date && (
          <p className="text-sm text-gray-500 mb-4">
            {new Date(report.session_date).toLocaleDateString()}
          </p>
        )}

        {report.notes && (
          <div className="prose dark:prose-invert max-w-none">
            <p>{report.notes}</p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
          Athlink — South Bay Sports Coaching
        </div>
      </div>
    </div>
  )
}