import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier, hasAccess } from '../../../lib/subscriptions'

interface RosterAthlete {
  id: string
  athlete_id: string
  name: string
  sport: string
  position: string
  skill_level: string
  notes: string | null
  added_at: string
  sessionCount: number
}

export function MyAthletes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState<RosterAthlete[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'
  const canAccess = hasAccess(tier, 'roster_unlimited')
  const MAX_FREE_ATHLETES = 5

  useEffect(() => {
    if (!user) return
    fetchProfileAndRoster()
  }, [user])

  const fetchProfileAndRoster = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    if (!profileData?.id) { setLoading(false); return }

    const { data: rosterData } = await supabase
      .from('athlete_roster')
      .select(`
        id,
        athlete_id,
        notes,
        added_at,
        athlete_profiles (
          id,
          name,
          sport,
          position,
          skill_level
        )
      `)
      .eq('coach_id', profileData.id)
      .order('added_at', { ascending: false })

    if (rosterData) {
      // Get session counts per athlete
      const athleteIds = rosterData.map((r: any) => r.athlete_id)

      const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('athlete_id')
        .eq('coach_id', profileData.id)
        .in('athlete_id', athleteIds)

      const countMap: Record<string, number> = {}
      if (bookingCounts) {
        for (const b of bookingCounts) {
          countMap[b.athlete_id] = (countMap[b.athlete_id] || 0) + 1
        }
      }

      const formatted = rosterData.map((r: any) => ({
        id: r.id,
        athlete_id: r.athlete_id,
        name: r.athlete_profiles?.name || 'Unknown',
        sport: r.athlete_profiles?.sport || '',
        position: r.athlete_profiles?.position || '',
        skill_level: r.athlete_profiles?.skill_level || '',
        notes: r.notes,
        added_at: r.added_at,
        sessionCount: countMap[r.athlete_id] || 0,
      }))

      setAthletes(formatted)
    }

    setLoading(false)
  }

  const handleRemoveFromRoster = async (rosterId: string) => {
    await supabase.from('athlete_roster').delete().eq('id', rosterId)
    setAthletes(prev => prev.filter(a => a.id !== rosterId))
  }

  const filteredAthletes = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.sport.toLowerCase().includes(search.toLowerCase())
  )

  const displayAthletes = canAccess
    ? filteredAthletes
    : filteredAthletes.slice(0, MAX_FREE_ATHLETES)

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">My Athletes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} on your roster
              {!canAccess && ` (Free plan: up to ${MAX_FREE_ATHLETES})`}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/coach')}
            className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
          >
            &larr; Dashboard
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search athletes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
          />
        </div>

        {/* Free tier limit notice */}
        {!canAccess && athletes.length >= MAX_FREE_ATHLETES && (
          <UpgradeGate tier={tier} feature="roster_unlimited">
            <div />
          </UpgradeGate>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading roster...</p>
          </div>
        ) : displayAthletes.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No athletes on your roster yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Athletes are added when they book a session with you.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayAthletes.map((athlete) => (
              <Card key={athlete.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#2563EB] font-semibold text-sm">
                        {athlete.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{athlete.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {athlete.sport}{athlete.position ? ` · ${athlete.position}` : ''}{athlete.skill_level ? ` · ${athlete.skill_level}` : ''}
                      </p>
                      {athlete.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{athlete.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {athlete.sessionCount} session{athlete.sessionCount !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/coach/athletes/${athlete.athlete_id}`}
                        className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleRemoveFromRoster(athlete.id)}
                        className="text-xs text-[#DC2626] hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {!canAccess && filteredAthletes.length > MAX_FREE_ATHLETES && (
              <UpgradeGate tier={tier} feature="roster_unlimited">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">
                  {filteredAthletes.length - MAX_FREE_ATHLETES} more athletes — upgrade to see all
                </p>
              </UpgradeGate>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}