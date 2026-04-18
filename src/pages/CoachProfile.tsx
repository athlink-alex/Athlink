import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, type CoachProfile, type AvailabilitySlot, type Review } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { AppLayout } from '../components/layout/AppLayout'

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function CoachProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [coach, setCoach] = useState<CoachProfile | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoach = async () => {
      if (!id) return

      try {
        const [coachResult, availResult, reviewsResult] = await Promise.all([
          supabase.from('coach_profiles').select('*').eq('id', id).eq('status', 'approved').single(),
          supabase.from('availability_slots').select('*').eq('coach_id', id).eq('is_booked', false),
          supabase.from('reviews').select('*').eq('coach_id', id).order('created_at', { ascending: false }).limit(10),
        ])

        if (coachResult.error) {
          console.error('Error fetching coach:', coachResult.error)
          return
        }

        setCoach(coachResult.data as CoachProfile)
        setAvailability((availResult.data ?? []) as AvailabilitySlot[])
        setReviews((reviewsResult.data ?? []) as Review[])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCoach()
  }, [id])

  if (loading) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
        </div>
      </AppLayout>
    )
  }

  if (!coach) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Coach not found</p>
          <Link to="/coaches">
            <Button variant="secondary">Back to coaches</Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const formatTime = (time: string) => {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${m} ${ampm}`
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="mb-6">
          <Link to="/coaches" className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium">
            &larr; Back to coaches
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coach Header */}
            <Card className="p-8">
              <div className="flex items-start gap-6 mb-6">
                <Avatar name={coach.name} src={coach.photo_url} size="xl" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">{coach.name}</h1>
                    <Badge status="completed">Verified</Badge>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{coach.sport}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-medium">{coach.avg_rating?.toFixed(1) || 'New'}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">{coach.experience_years || 0} years experience</span>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="border-t border-[#E5E7EB] dark:border-gray-800 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">About</h2>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {coach.bio || 'No bio available'}
                </p>
              </div>

              {/* Certifications */}
              {coach.certifications_url && (
                <div className="border-t border-[#E5E7EB] dark:border-gray-800 pt-6 mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">Certifications</h2>
                  <a
                    href={coach.certifications_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                  >
                    View Certifications &rarr;
                  </a>
                </div>
              )}
            </Card>

            {/* Availability */}
            <Card className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Availability</h2>
              {availability.length > 0 ? (
                <div className="space-y-2">
                  {DAYS_ORDER.map((day) => {
                    const daySlots = availability.filter(s => s.day_of_week === day)
                    if (daySlots.length === 0) return null
                    return (
                      <div key={day} className="flex items-center gap-4 py-2 border-b border-[#E5E7EB] dark:border-gray-700 last:border-0">
                        <span className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{day}</span>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((slot) => (
                            <span key={slot.id} className="px-3 py-1 bg-[#F9FAFB] dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm text-gray-600 dark:text-gray-400">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Contact coach for availability details.</p>
              )}
            </Card>

            {/* Reviews */}
            <Card className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
                Reviews ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-[#E5E7EB] dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-[#F59E0B]' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No reviews yet. Be the first to review this coach!</p>
              )}
            </Card>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    ${(coach.hourly_rate || 0) / 100}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">per session</p>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  onClick={() => navigate(`/book/${coach.id}`)}
                >
                  Book a Session
                </Button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Free cancellation up to 24 hours
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}