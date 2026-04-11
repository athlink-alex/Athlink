import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Coach {
  id: string
  name: string
  sport: string
  hourly_rate: number
  experience_years: number
  avg_rating: number | null
  bio: string
}

const SPORTS = ['All', 'Baseball', 'Basketball', 'Soccer', 'Tennis', 'Volleyball', 'Swimming']

export function CoachDiscovery() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState('All')
  const [priceRange, setPriceRange] = useState(200)

  useEffect(() => {
    const fetchCoaches = async () => {
      let query = supabase
        .from('coach_profiles')
        .select('*')
        .eq('status', 'approved')

      if (selectedSport !== 'All') {
        query = query.eq('sport', selectedSport)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching coaches:', error)
        return
      }

      // Filter by price range
      const filtered = (data || []).filter(
        (coach) => (coach.hourly_rate || 0) / 100 <= priceRange
      )

      setCoaches(filtered)
      setLoading(false)
    }

    fetchCoaches()
  }, [selectedSport, priceRange])

  const filteredCoaches = coaches.filter((coach) =>
    coach.name.toLowerCase().includes(search.toLowerCase()) ||
    coach.bio?.toLowerCase().includes(search.toLowerCase())
  )

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
              to="/dashboard/athlete"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find a Coach</h1>

          {/* Search & Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search coaches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {SPORTS.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSport === sport
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price: ${priceRange}/session
              </label>
              <input
                type="range"
                min="30"
                max="200"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredCoaches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No coaches found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
              <div
                key={coach.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      {coach.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{coach.name}</h3>
                      <p className="text-sm text-gray-500">{coach.sport}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-gray-900">
                      {coach.avg_rating?.toFixed(1) || 'New'}
                    </span>
                    <span className="text-gray-500 text-sm">• {coach.experience_years} years exp</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {coach.bio || 'No bio available'}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ${(coach.hourly_rate || 0) / 100}/hr
                    </span>
                    <Link
                      to={`/coaches/${coach.id}`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
