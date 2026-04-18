import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '../lib/stripe'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { BookingPayment } from '../components/payments/BookingPayment'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { AppLayout } from '../components/layout/AppLayout'

interface Coach {
  id: string
  name: string
  sport: string
  hourly_rate: number
  photo_url?: string | null
}

interface Slot {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_booked: boolean
}

export function BookingFlow() {
  const { coachId } = useParams<{ coachId: string }>()
  const navigate = useNavigate()
  const { user, membershipTier } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [coach, setCoach] = useState<Coach | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])

  // Generate next 14 days for selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  // Elite priority slots (highlighted gold)
  const eliteSlots = ['09:00', '10:00', '11:00']

  useEffect(() => {
    const fetchCoach = async () => {
      if (!coachId) return

      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id, name, sport, hourly_rate, photo_url')
        .eq('id', coachId)
        .single()

      if (error) {
        console.error('Error fetching coach:', error)
        return
      }

      setCoach(data)
      setLoading(false)
    }

    fetchCoach()
  }, [coachId])

  // Fetch available slots when date is selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !coachId) return

      const dayOfWeek = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('coach_id', coachId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_booked', false)

      if (error) {
        console.error('Error fetching slots:', error)
        // Fall back to time slots if no availability data
        const fallbackSlots = [
          '08:00', '09:00', '10:00', '11:00', '12:00',
          '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
        ].map((time, idx) => ({
          id: `slot-${idx}`,
          day_of_week: dayOfWeek,
          start_time: time,
          end_time: `${parseInt(time.split(':')[0]) + 1}:00`,
          is_booked: false,
        }))
        setAvailableSlots(fallbackSlots)
        return
      }

      setAvailableSlots(data || [])
    }

    fetchSlots()
  }, [selectedDate, coachId])

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot')
      return
    }
    setError('')
    setStep(2)
  }

  const handlePaymentSuccess = () => {
    navigate('/dashboard/athlete', { state: { bookingSuccess: true } })
  }

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
          <p className="text-gray-500 dark:text-gray-400">Coach not found</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Step {step} of 2
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {step === 1 ? 'Select Time' : 'Confirm & Pay'}
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-[#2563EB] h-2 rounded-full transition-all"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-[#DC2626] rounded-[8px] text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Avatar name={coach.name} src={coach.photo_url || null} size="md" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Book with {coach.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{coach.sport} &middot; ${(coach.hourly_rate || 0) / 100}/session</p>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 mb-6">Select a date and time for your session.</p>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Date
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {availableDates.map((date) => {
                      const dateObj = new Date(date + 'T00:00:00')
                      const isSelected = selectedDate === date
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedSlot(null)
                            setError('')
                          }}
                          className={`p-2 sm:p-3 text-sm rounded-[8px] border text-center transition-colors ${
                            isSelected
                              ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]'
                              : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xs">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="font-medium">{dateObj.getDate()}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Time Slot
                    </label>
                    {membershipTier === 'elite' && (
                      <p className="text-xs text-[#D97706] mb-2">
                        Gold-highlighted slots are priority access for Elite members.
                      </p>
                    )}
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No available slots for this date.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map((slot) => {
                          const isEliteSlot = eliteSlots.includes(slot.start_time)
                          const isSelected = selectedSlot?.id === slot.id
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot)
                                setError('')
                              }}
                              className={`p-3 text-sm rounded-[8px] border transition-colors ${
                                isSelected
                                  ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] font-medium'
                                  : isEliteSlot
                                    ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5 hover:border-[#F59E0B]'
                                    : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                                {isEliteSlot && (
                                  <svg className="w-3 h-3 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  disabled={!selectedDate || !selectedSlot}
                >
                  Continue
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Confirm your booking</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Review your session details and complete payment.</p>

              <div className="bg-[#F9FAFB] dark:bg-gray-900 rounded-[8px] p-6 mb-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Coach</span>
                    <span className="font-medium">{coach.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sport</span>
                    <span className="font-medium">{coach.sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date</span>
                    <span className="font-medium">
                      {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString()}
                    </span>
                  </div>
                  {selectedSlot && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time</span>
                      <span className="font-medium">{selectedSlot.start_time} - {selectedSlot.end_time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <Badge status="scheduled" />
                  </div>
                  <div className="border-t border-[#E5E7EB] dark:border-gray-800 pt-4 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">${(coach.hourly_rate || 0) / 100}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <Button variant="secondary" onClick={() => setStep(1)} fullWidth>
                  Back
                </Button>
              </div>

              {/* Stripe Payment Component - integrated by Payments Engineer */}
              {selectedSlot && (
                <Elements stripe={stripePromise}>
                  <BookingPayment
                    amount={(coach.hourly_rate || 0)}
                    coachId={coachId!}
                    slotId={selectedSlot.id}
                    sessionDate={`${selectedDate}T${selectedSlot.start_time}`}
                    coachName={coach.name}
                    sport={coach.sport}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}