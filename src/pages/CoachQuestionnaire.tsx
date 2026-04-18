import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const TOTAL_STEPS = 4

const PLAYING_BACKGROUNDS = [
  { value: 'high-school', label: 'High school' },
  { value: 'college', label: 'College (JUCO or 4-year)' },
  { value: 'independent', label: 'Independent / Semi-pro league' },
  { value: 'minor-leagues', label: 'Minor leagues' },
  { value: 'coach-primary', label: "I'm primarily a coach (no playing background)" },
]

const COACHING_SPECIALTIES = [
  { value: 'hitting', label: 'Hitting' },
  { value: 'pitching', label: 'Pitching & arm care' },
  { value: 'fielding', label: 'Fielding & defense' },
  { value: 'catching', label: 'Catching' },
  { value: 'speed', label: 'Speed, agility & athleticism' },
  { value: 'overall', label: 'Overall development / Youth coaching' },
]

const AGE_GROUPS = [
  { value: 'youth-6-10', label: 'Youth (ages 6\u201310)' },
  { value: 'little-league-11-13', label: 'Little League / Rec (ages 11\u201313)' },
  { value: 'travel-12-16', label: 'Travel & Club (ages 12\u201316)' },
  { value: 'high-school-14-18', label: 'High School (ages 14\u201318)' },
  { value: 'college-adult', label: 'College & Adult' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'weekday-morning', label: 'Weekday mornings' },
  { value: 'weekday-evening', label: 'Weekday afternoons/evenings' },
  { value: 'weekends', label: 'Weekends' },
]

export function CoachQuestionnaire() {
  const [step, setStep] = useState(1)
  const [playingBackground, setPlayingBackground] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [ageGroups, setAgeGroups] = useState<string[]>([])
  const [availability, setAvailability] = useState<string[]>([])
  const navigate = useNavigate()

  const toggleAgeGroup = (value: string) => {
    setAgeGroups((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    )
  }

  const toggleAvailability = (value: string) => {
    setAvailability((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    )
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!playingBackground
      case 2: return !!specialty
      case 3: return ageGroups.length > 0
      case 4: return availability.length > 0
      default: return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else if (step === TOTAL_STEPS) setStep(5) // summary
  }

  const handleFinish = () => {
    const answers = { playingBackground, specialty, ageGroups, availability }
    localStorage.setItem('athlink_coach_questionnaire', JSON.stringify(answers))
    navigate('/signup?role=coach')
  }

  const getLabel = (value: string, options: { value: string; label: string }[]) =>
    options.find((o) => o.value === value)?.label || value

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-[#2563EB]">Athlink</Link>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="w-full bg-[#E5E7EB] dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#2563EB] h-2 rounded-full transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Step 1: Playing Background */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              What was your highest level of baseball playing experience?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">This helps athletes understand your background.</p>

            <div className="space-y-3">
              {PLAYING_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setPlayingBackground(bg.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    playingBackground === bg.value
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <span className={`font-medium ${playingBackground === bg.value ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <Button fullWidth disabled={!canProceed()} onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Coaching Specialty */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              What is your primary coaching specialty?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Pick the one that best describes your focus.</p>

            <div className="space-y-3">
              {COACHING_SPECIALTIES.map((spec) => (
                <button
                  key={spec.value}
                  type="button"
                  onClick={() => setSpecialty(spec.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    specialty === spec.value
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <span className={`font-medium ${specialty === spec.value ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {spec.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep(1)}>Back</Button>
              <Button fullWidth disabled={!canProceed()} onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Age Groups */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              What age groups do you typically work with?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Select all that apply.</p>

            <div className="space-y-3">
              {AGE_GROUPS.map((group) => (
                <button
                  key={group.value}
                  type="button"
                  onClick={() => toggleAgeGroup(group.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    ageGroups.includes(group.value)
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <span className={`font-medium ${ageGroups.includes(group.value) ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {group.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep(2)}>Back</Button>
              <Button fullWidth disabled={!canProceed()} onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              When are you generally available to coach?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Select all that apply.</p>

            <div className="space-y-3">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleAvailability(opt.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    availability.includes(opt.value)
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <span className={`font-medium ${availability.includes(opt.value) ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep(3)}>Back</Button>
              <Button fullWidth disabled={!canProceed()} onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {step === 5 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200 text-center">
            <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">You&apos;re a great fit for Athlink</h2>
            <div className="text-left space-y-2 mb-6 p-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Background:</span> {getLabel(playingBackground, PLAYING_BACKGROUNDS)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Specialty:</span> {getLabel(specialty, COACHING_SPECIALTIES)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Age groups:</span> {ageGroups.map((g) => getLabel(g, AGE_GROUPS)).join(', ')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Availability:</span> {availability.map((a) => getLabel(a, AVAILABILITY_OPTIONS)).join(', ')}</p>
            </div>
            <Button fullWidth onClick={handleFinish}>
              Apply to Coach
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}