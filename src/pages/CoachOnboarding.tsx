import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PhotoUpload } from '../components/PhotoUpload'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const SPORTS = ['Baseball']

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
  const [sport, setSport] = useState('Baseball')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

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
      setError('Please fill in your name')
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
      // Create coach profile — we need the returned profile id for availability slots
      const { data: profileData, error: profileError } = await supabase
        .from('coach_profiles')
        .insert([
          {
            user_id: user?.id,
            name,
            bio,
            sport,
            experience_years: parseInt(experienceYears) || 0,
            certifications_url: certifications,
            hourly_rate: parseInt(hourlyRate) * 100,
            photo_url: photoUrl,
            status: 'pending',
          },
        ])
        .select('id')
        .single()

      if (profileError) throw profileError

      // Create availability slots using coach_profiles.id (not user.id)
      const coachProfileId = profileData.id
      const slots = Object.entries(availability).map(([day, times]) => ({
        coach_id: coachProfileId,
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

  const stepLabels = ['Profile', 'Credentials', 'Pricing & Availability']

  // Step 4: Verification pending screen
  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-xl mx-auto text-center">
          <Card className="p-8 dark:bg-gray-950 transition-colors duration-200">
            <div className="w-16 h-16 bg-[#F59E0B]/10 dark:bg-[#F59E0B]/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Profile Under Review</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Thanks for signing up! We&apos;re reviewing your profile and will notify you once you&apos;re approved.
              This usually takes 1-2 business days.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              You&apos;ll receive an email when your profile is approved and you can start accepting bookings.
            </p>
            <Button onClick={() => navigate('/dashboard/coach')}>
              View Dashboard
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Step {step} of 3
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stepLabels[step - 1]}
            </span>
          </div>
          <div className="w-full bg-[#E5E7EB] dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#2563EB] h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {stepLabels.map((label, idx) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${idx < step ? 'bg-[#2563EB]' : 'bg-[#E5E7EB] dark:bg-gray-700'}`} />
                <span className={`text-xs hidden sm:inline ${idx < step ? 'text-[#2563EB] font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-[#DC2626] rounded-[8px] text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <Card className="p-8 dark:bg-gray-950 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Create your coach profile</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Tell athletes about yourself.</p>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Coach John Smith"
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell athletes about your coaching philosophy and experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sport
                </label>
                <div className="px-4 py-2 bg-[#2563EB]/5 border border-[#2563EB] rounded-[8px] text-[#2563EB] font-medium text-sm inline-block">
                  Baseball
                </div>
              </div>

              <PhotoUpload
                onUploadComplete={setPhotoUrl}
                currentUrl={photoUrl}
                label="Profile Photo (optional)"
              />

              <Button type="submit" fullWidth>Continue</Button>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8 dark:bg-gray-950 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Your credentials</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Help athletes understand your expertise.</p>

            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="5"
                  min="0"
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certifications & Highlights
                </label>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="USPTA Certified, Former D1 Athlete, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" fullWidth>Continue</Button>
              </div>
            </form>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8 dark:bg-gray-950 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Pricing & Availability</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Set your rates and when you&apos;re available.</p>

            <form onSubmit={handleStep3Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="75"
                  min="20"
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Athletes will pay this amount per session
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weekly Availability
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select days and times you&apos;re typically available
                </p>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`w-20 py-2 text-sm rounded-[8px] border transition-colors ${
                          availability[day.value]
                            ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] font-medium'
                            : 'border-[#E5E7EB] dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
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
                            className="px-2 py-1 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] text-sm"
                          />
                          <span className="text-gray-500 dark:text-gray-400">to</span>
                          <input
                            type="time"
                            value={availability[day.value].end}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                [day.value]: { ...prev[day.value], end: e.target.value },
                              }))
                            }
                            className="px-2 py-1 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" fullWidth loading={loading}>
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}