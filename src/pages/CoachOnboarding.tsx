import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const SPORTS = [
  'Baseball',
  'Basketball',
  'Soccer',
  'Tennis',
  'Volleyball',
  'Swimming',
  'Football',
  'Golf',
  'Other',
]

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

export function CoachOnboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  // Step 1: Profile
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [sport, setSport] = useState('')

  // Step 2: Credentials
  const [experienceYears, setExperienceYears] = useState('')
  const [certifications, setCertifications] = useState('')

  // Step 3: Pricing & Availability
  const [hourlyRate, setHourlyRate] = useState('')
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string }>>({})

  const handleDayToggle = (day: string) => {
    setAvailability((prev) => {
      if (prev[day]) {
        const { [day]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [day]: { start: '09:00', end: '17:00' } }
    })
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !sport) {
      setError('Please fill in all required fields')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep(3)
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hourlyRate || Object.keys(availability).length === 0) {
      setError('Please set your hourly rate and select at least one available day')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create coach profile
      const { error: profileError } = await supabase
        .from('coach_profiles')
        .insert([
          {
            user_id: user?.id,
            name,
            bio,
            sport,
            experience_years: parseInt(experienceYears) || 0,
            certifications_url: certifications,
            hourly_rate: parseInt(hourlyRate) * 100, // Convert to cents
            status: 'pending',
          },
        ])

      if (profileError) throw profileError

      // Create availability slots
      const slots = Object.entries(availability).map(([day, times]) => ({
        coach_id: user?.id,
        day_of_week: day,
        start_time: times.start,
        end_time: times.end,
        is_booked: false,
      }))

      const { error: slotsError } = await supabase
        .from('availability_slots')
        .insert(slots)

      if (slotsError) throw slotsError

      // Move to pending verification step
      setStep(4)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="bg-white shadow-sm rounded-lg p-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Under Review</h2>
            <p className="text-gray-500 mb-6">
              Thanks for signing up! We're reviewing your profile and will notify you once you're approved.
              This usually takes 1-2 business days.
            </p>
            <button
              onClick={() => navigate('/dashboard/coach')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-900">
              Step {step} of 3
            </span>
            <span className="text-sm text-gray-500">
              {step === 1 ? 'Profile' : step === 2 ? 'Credentials' : 'Availability'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your coach profile</h2>
            <p className="text-gray-500 mb-6">Tell athletes about yourself.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Coach John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell athletes about your coaching philosophy and experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Sport
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SPORTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSport(s)}
                      className={`py-2 px-3 text-sm rounded-lg border ${
                        sport === s
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {s}
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
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your credentials</h2>
            <p className="text-gray-500 mb-6">Help athletes understand your expertise.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="5"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications & Highlights
                </label>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="USPTA Certified, Former D1 Athlete, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
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
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Availability</h2>
            <p className="text-gray-500 mb-6">Set your rates and when you're available.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="75"
                  min="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Athletes will pay this amount per session
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Availability
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select days and times you're typically available
                </p>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`w-20 py-2 text-sm rounded-lg border ${
                          availability[day.value]
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        {day.label}
                      </button>
                      {availability[day.value] && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={availability[day.value].start}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                [day.value]: { ...prev[day.value], start: e.target.value },
                              }))
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={availability[day.value].end}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                [day.value]: { ...prev[day.value], end: e.target.value },
                              }))
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
