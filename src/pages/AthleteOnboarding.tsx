import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '../lib/stripe'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { EliteUpgrade } from '../components/payments/EliteUpgrade'
import { PhotoUpload } from '../components/PhotoUpload'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Competitive player' },
]

const SPORTS = ['Baseball']

export function AthleteOnboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  // Step 1: Profile
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Step 2: Sport Details
  const [sport, setSport] = useState('Baseball')
  const [position, setPosition] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [goals, setGoals] = useState('')

  // Step 3: Tier selection
  const [selectedTier, setSelectedTier] = useState<'free' | 'elite' | null>(null)

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !age) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sport || !skillLevel) {
      setError('Please select a skill level')
      return
    }
    setError('')
    setStep(3)
  }

  const handleFreeTierSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const { error: profileError } = await supabase
        .from('athlete_profiles')
        .insert([
          {
            user_id: user?.id,
            name,
            sport,
            position,
            skill_level: skillLevel,
            goals,
            photo_url: photoUrl,
          },
        ])

      if (profileError) throw profileError

      navigate('/dashboard/athlete')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleEliteSuccess = async () => {
    try {
      const { error: profileError } = await supabase
        .from('athlete_profiles')
        .insert([
          {
            user_id: user?.id,
            name,
            sport,
            position,
            skill_level: skillLevel,
            goals,
            photo_url: photoUrl,
          },
        ])

      if (profileError) {
        console.error('Profile creation error after elite upgrade:', profileError)
      }

      navigate('/dashboard/athlete')
    } catch (err) {
      console.error('Navigation error:', err)
    }
  }

  const stepLabels = ['Profile', 'Sport Details', 'Membership']

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Tell us about yourself</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">This helps us find the right coach for you.</p>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="15"
                  min="5"
                  max="100"
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Your baseball details</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Tell us what you&apos;re looking to improve.</p>

            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sport
                </label>
                <div className="px-4 py-2 bg-[#2563EB]/5 border border-[#2563EB] rounded-[8px] text-[#2563EB] font-medium text-sm inline-block">
                  Baseball
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position (optional)
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Pitcher, Shortstop, Outfield"
                  className="w-full px-3 py-2 border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-600 rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill Level
                </label>
                <div className="space-y-2">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setSkillLevel(level.value)}
                      className={`w-full p-3 rounded-[8px] border text-left transition-colors ${
                        skillLevel === level.value
                          ? 'border-[#2563EB] bg-[#2563EB]/5'
                          : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-50">{level.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Goals (optional)
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="What are you hoping to achieve?"
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
          <div className="space-y-6">
            <Card className="p-8 dark:bg-gray-950 transition-colors duration-200">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Choose your plan</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start with a free account or upgrade to Elite for priority booking and exclusive perks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Free Tier */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('free')}
                  className={`p-6 rounded-[8px] border-2 text-left transition-all ${
                    selectedTier === 'free'
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-1">Free</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">$0</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">/month</div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Browse coaches
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Book sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Leave reviews
                    </li>
                  </ul>
                </button>

                {/* Elite Tier */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('elite')}
                  className={`p-6 rounded-[8px] border-2 text-left transition-all ${
                    selectedTier === 'elite'
                      ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-50">Elite</div>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#F59E0B]/15 dark:bg-[#F59E0B]/5 text-[#D97706] border border-[#F59E0B]/30">
                      RECOMMENDED
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">$19</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">/month</div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Everything in Free
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Priority booking slots
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Gold Elite badge
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Early access to new coaches
                    </li>
                  </ul>
                </button>
              </div>
            </Card>

            {/* Free tier completion */}
            {selectedTier === 'free' && (
              <Card className="p-6 dark:bg-gray-950 transition-colors duration-200">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You can upgrade to Elite anytime from your dashboard.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setStep(2)}>Back</Button>
                  <Button fullWidth loading={loading} onClick={handleFreeTierSubmit}>
                    {loading ? 'Setting up...' : 'Start for Free'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Elite tier payment */}
            {selectedTier === 'elite' && (
              <div>
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    &larr; Back to sport details
                  </button>
                </div>
                <Elements stripe={stripePromise}>
                  <EliteUpgrade />
                </Elements>
                <Button fullWidth className="mt-4" onClick={handleEliteSuccess}>
                  Continue to Dashboard
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}