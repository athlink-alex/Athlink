import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Coach {
  id: string
  name: string
  sport: string
  bio: string
  hourly_rate: number
  experience_years: number
  avg_rating: number | null
  certifications_url: string | null
}

export function CoachProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoach = async () => {
      if (!id) return

      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single()

      if (error) {
        console.error('Error fetching coach:', error)
        return
      }

      setCoach(data)
      setLoading(false)
    }

    fetchCoach()
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-12 text-center">Loading...</div>
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center">
        <p>Coach not found</p>
        <Link to="/coaches" className="text-primary-600">Back to coaches</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Athlink
            </Link>
            <Link
              to="/coaches"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              ← Back to Coaches
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                  {coach.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{coach.name}</h1>
                  <p className="text-lg text-gray-600 mb-2">{coach.sport}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 font-medium">{coach.avg_rating?.toFixed(1) || 'New'}</span>
                    </div>
                    <span className="text-gray-500">• {coach.experience_years} years experience</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {coach.bio || 'No bio available'}
                  </p>
                </div>

                {coach.certifications_url && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h2>
                    <a
                      href={coach.certifications_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      View Certifications →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-gray-900">
                  ${(coach.hourly_rate || 0) / 100}
                </p>
                <p className="text-gray-500">per session</p>
              </div>

              <button
                onClick={() => navigate(`/book/${coach.id}`)}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium mb-4"
              >
                Book a Session
              </button>

              <div className="text-center text-sm text-gray-500">
                <p>Free cancellation up to 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
