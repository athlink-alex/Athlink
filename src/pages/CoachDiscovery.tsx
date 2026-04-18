import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, type CoachProfile } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { AppLayout } from '../components/layout/AppLayout'

const LOCATIONS = ['All', 'Hermosa Beach', 'Manhattan Beach', 'Redondo Beach', 'Torrance']

const COMING_SOON_SPORTS = [
  { emoji: '\u26BE', name: 'Softball' },
  { emoji: '\u26F3', name: 'Golf' },
  { emoji: '\uD83C\uDFC0', name: 'Basketball' },
  { emoji: '\u26BD', name: 'Soccer' },
  { emoji: '\uD83C\uDFBE', name: 'Tennis' },
]

// Demo coaches for fallback when no real data — baseball only
const DEMO_COACHES: CoachProfile[] = [
  {
    id: 'demo-1',
    user_id: '',
    name: 'Marcus Reid',
    sport: 'Baseball',
    bio: 'Former D1 shortstop with 8 years coaching youth and high school athletes.',
    certifications_url: null,
    hourly_rate: 6500,
    experience_years: 8,
    status: 'approved',
    avg_rating: 4.9,
    photo_url: null,
    subscription_tier: 'free',
    stripe_subscription_id: null,
    subscription_current_period_end: null,
  },
  {
    id: 'demo-5',
    user_id: '',
    name: 'Jake Morrow',
    sport: 'Baseball',
    bio: 'Biomechanics-focused pitching coach for youth through collegiate athletes.',
    certifications_url: null,
    hourly_rate: 7500,
    experience_years: 15,
    status: 'approved',
    avg_rating: 5.0,
    photo_url: null,
    subscription_tier: 'free',
    stripe_subscription_id: null,
    subscription_current_period_end: null,
  },
]

export function CoachDiscovery() {
  const { membershipTier } = useAuth()
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('All')
  const [priceRange, setPriceRange] = useState(200)

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        let query = supabase
          .from('coach_profiles')
          .select('*')
          .eq('status', 'approved')

        const { data, error } = await query

        if (error) {
          setCoaches(DEMO_COACHES)
        } else {
          const coachData = (data && data.length > 0) ? data as CoachProfile[] : DEMO_COACHES

          const filtered = coachData.filter(
            (coach) => (coach.hourly_rate || 0) / 100 <= priceRange
          )
          setCoaches(filtered)
        }
      } catch {
        setCoaches(DEMO_COACHES)
      } finally {
        setLoading(false)
      }
    }

    fetchCoaches()
  }, [priceRange])

  const filteredCoaches = coaches.filter((coach) =>
    coach.name?.toLowerCase().includes(search.toLowerCase()) ||
    coach.bio?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Find a Baseball Coach</h1>
          <p className="text-gray-500 dark:text-gray-400">Browse vetted baseball coaches in the South Bay area.</p>
        </div>

        {/* Search & Filters */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Search coaches by name or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Location filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-1.5 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Price range slider */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
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
        </Card>

        {/* Elite notice */}
        {membershipTier !== 'elite' && (
          <div className="mb-6 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-[8px]">
            <p className="text-sm text-[#D97706]">
              <span className="font-semibold">Upgrade to Elite</span> for priority booking on popular time slots and early access to new coaches.
            </p>
          </div>
        )}

        {/* Coaches Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading coaches...</p>
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No coaches found matching your criteria.</p>
            <Button variant="secondary" onClick={() => { setSearch(''); setPriceRange(200); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
              <Card key={coach.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar name={coach.name} src={coach.photo_url} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-50 truncate">{coach.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <svg className="w-5 h-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {coach.avg_rating?.toFixed(1) || 'New'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm"> &middot; {coach.experience_years || 0} yrs exp</span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {coach.bio || 'No bio available'}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      ${(coach.hourly_rate || 0) / 100}/hr
                    </span>
                    <Link to={`/coaches/${coach.id}`}>
                      <Button size="sm">View Profile</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* More Sports Coming Soon */}
        <div className="mt-16 pt-12 border-t border-[#E5E7EB] dark:border-gray-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">More Sports Coming Soon</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">We're expanding. Here's what's next.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {COMING_SOON_SPORTS.map((sport) => (
              <div
                key={sport.name}
                className="relative flex flex-col items-center justify-center p-6 bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] dark:opacity-40 opacity-50 cursor-not-allowed select-none transition-colors duration-200"
              >
                <span className="text-3xl mb-2">{sport.emoji}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{sport.name}</span>
                <span className="mt-2 px-2 py-0.5 bg-[#E5E7EB] dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}