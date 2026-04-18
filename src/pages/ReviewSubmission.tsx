import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { AppLayout } from '../components/layout/AppLayout'

export function ReviewSubmission() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Fetch booking details to get coach_id
      const { data: booking } = await supabase
        .from('bookings')
        .select('coach_id')
        .eq('id', sessionId)
        .single()

      if (!booking) throw new Error('Booking not found')

      const { error: reviewError } = await supabase.from('reviews').insert([
        {
          booking_id: sessionId,
          athlete_id: user?.id,
          coach_id: booking.coach_id,
          rating,
          comment,
        },
      ])

      if (reviewError) throw reviewError

      setSubmitted(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
          <div className="max-w-md mx-auto text-center">
            <Card className="p-8">
              <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Thank you!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Your review has been submitted successfully.</p>
              <Button onClick={() => navigate('/dashboard/athlete')}>
                Back to Dashboard
              </Button>
            </Card>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Rate your session</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">How was your experience with the coach?</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-[#DC2626] rounded-[8px] text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating) ? 'text-[#F59E0B]' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review (optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <Button type="submit" fullWidth loading={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}