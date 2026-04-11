import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Coach {
  id: string
  name: string
  sport: string
  hourly_rate: number
}

export function BookingFlow() {
  const { coachId } = useParams<{ coachId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [coach, setCoach] = useState<Coach | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // Generate next 14 days for selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ]

  useEffect(() => {
    const fetchCoach = async () => {
      if (!coachId) return

      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id, name, sport, hourly_rate')
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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time')
      return
    }
    setError('')
    setStep(2)
  }

  const handleBooking = async () => {
    setLoading(true)
    setError('')

    try {
      // In a real implementation, this would:
      // 1. Create a Stripe PaymentIntent
      // 2. Create the booking record
      // 3. Link to payment page

      const sessionDate = `${selectedDate}T${selectedTime}`

      const { error: bookingError } = await supabase.from('bookings').insert([
        {
          athlete_id: user?.id,
          coach_id: coachId,
          slot_id: 'placeholder',
          session_date: sessionDate,
          status: 'scheduled',
          payment_status: 'escrow_held',
          amount: coach?.hourly_rate || 0,
        },
      ])

      if (bookingError) throw bookingError

      navigate('/dashboard/athlete')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-12 text-center">Loading...</div>
  }

  if (!coach) {
    return <div className="min-h-screen bg-gray-50 py-12 text-center">Coach not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-900">
              Step {step} of 2
            </span>
            <span className="text-sm text-gray-500">
              {step === 1 ? 'Select Time' : 'Confirm & Pay'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Book with {coach.name}</h2>
            <p className="text-gray-500 mb-6">Select a date and time for your session.</p>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 text-sm rounded-lg border text-center ${
                        selectedDate === date
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="font-medium">{new Date(date).getDate()}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-sm rounded-lg border ${
                        selectedTime === time
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Continue
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm your booking</h2>
            <p className="text-gray-500 mb-6">Review your session details.</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coach</span>
                  <span className="font-medium">{coach.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sport</span>
                  <span className="font-medium">{coach.sport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">${(coach.hourly_rate || 0) / 100}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
