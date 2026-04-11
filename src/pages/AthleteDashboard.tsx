import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface BookingWithCoach {
  id: string
  session_date: string
  status: string
  coach_name: string
  sport: string
}

export function AthleteDashboard() {
  const { user, isAthlete, membershipTier } = useAuth()
  const [bookings, setBookings] = useState<BookingWithCoach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          status,
          coach_profiles (name, sport)
        `)
        .eq('athlete_id', user.id)
        .order('session_date', { ascending: true })
        .limit(5)

      if (error) {
        console.error('Error fetching bookings:', error)
        return
      }

      const formatted = data.map((booking: any) => ({
        id: booking.id,
        session_date: booking.session_date,
        status: booking.status,
        coach_name: booking.coach_profiles?.name || 'Unknown',
        sport: booking.coach_profiles?.sport || '',
      }))

      setBookings(formatted)
      setLoading(false)
    }

    fetchBookings()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              {membershipTier === 'elite' && (
                <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full border border-amber-200">
                  ELITE
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Sessions Booked</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {bookings.filter(b => b.status === 'scheduled').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Membership</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 capitalize">
              {membershipTier}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mb-8">
          <Link
            to="/coaches"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Find a Coach
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">No sessions booked yet</p>
                <Link
                  to="/coaches"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Browse coaches →
                </Link>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="p-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{booking.coach_name}</p>
                    <p className="text-sm text-gray-500">
                      {booking.sport} • {new Date(booking.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
