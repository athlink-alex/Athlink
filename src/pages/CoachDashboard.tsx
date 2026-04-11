import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface BookingWithAthlete {
  id: string
  session_date: string
  status: string
  amount: number
  athlete_name: string
}

export function CoachDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<BookingWithAthlete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      // Fetch coach profile
      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          status,
          amount,
          athlete_profiles (name)
        `)
        .eq('coach_id', user.id)
        .order('session_date', { ascending: true })

      if (bookingsData) {
        const formatted = bookingsData.map((b: any) => ({
          id: b.id,
          session_date: b.session_date,
          status: b.status,
          amount: b.amount,
          athlete_name: b.athlete_profiles?.name || 'Unknown',
        }))
        setBookings(formatted)
      }

      setLoading(false)
    }

    fetchData()
  }, [user])

  const pendingEarnings = bookings
    .filter(b => b.status === 'scheduled')
    .reduce((sum, b) => sum + b.amount, 0)

  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Athlink
            </Link>
            <div className="flex items-center gap-4">
              {profile?.status === 'pending' && (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full border border-amber-200">
                  Under Review
                </span>
              )}
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {profile?.status === 'pending' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Your profile is under review. You'll be able to accept bookings once approved.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {bookings.filter(b => b.status === 'scheduled').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Earnings Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium">${(pendingEarnings / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-green-600">${(totalEarnings / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/onboarding/coach"
                className="block text-primary-600 hover:text-primary-700 font-medium"
              >
                Edit Profile →
              </Link>
              <Link
                to="#"
                className="block text-primary-600 hover:text-primary-700 font-medium"
              >
                Manage Availability →
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No bookings yet. They'll appear here once athletes book sessions.
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="p-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{booking.athlete_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
