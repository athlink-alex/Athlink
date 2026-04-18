import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const TOTAL_STEPS = 4

const POSITIONS = [
  { value: 'pitcher', label: 'Pitcher' },
  { value: 'catcher', label: 'Catcher' },
  { value: 'infield', label: 'Infield' },
  { value: 'outfield', label: 'Outfield' },
  { value: 'multi', label: 'Multi-position / Not sure yet' },
]

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Just starting out', sub: 'Beginner' },
  { value: 'recreational', label: "I've played a season or two", sub: 'Recreational' },
  { value: 'competitive', label: 'Travel ball / Club team', sub: 'Competitive' },
  { value: 'advanced', label: 'High school varsity', sub: 'Advanced' },
  { value: 'elite', label: 'College / Semi-pro', sub: 'Elite' },
]

const TRAINING_GOALS = [
  { value: 'hitting', label: 'Hitting & swing mechanics' },
  { value: 'pitching', label: 'Pitching & arm development' },
  { value: 'fielding', label: 'Fielding & footwork' },
  { value: 'speed', label: 'Speed & athleticism' },
  { value: 'mental', label: 'Mental game & confidence' },
  { value: 'overall', label: 'Overall development' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'weekday-morning', label: 'Weekday mornings' },
  { value: 'weekday-evening', label: 'Weekday afternoons/evenings' },
  { value: 'weekends', label: 'Weekends' },
]

export function AthleteQuestionnaire() {
  const [step, setStep] = useState(1)
  const [position, setPosition] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [availability, setAvailability] = useState<string[]>([])
  const navigate = useNavigate()

  const toggleGoal = (value: string) => {
    setGoals((prev) => {
      if (prev.includes(value)) return prev.filter((g) => g !== value)
      if (prev.length >= 2) return prev
      return [...prev, value]
    })
  }

  const toggleAvailability = (value: string) => {
    setAvailability((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    )
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!position
      case 2: return !!skillLevel
      case 3: return goals.length > 0
      case 4: return availability.length > 0
      default: return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else if (step === TOTAL_STEPS) setStep(5) // summary
  }

  const handleFinish = () => {
    const answers = { position, skillLevel, goals, availability }
    localStorage.setItem('athlink_athlete_questionnaire', JSON.stringify(answers))
    navigate('/signup?role=athlete')
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

        {/* Step 1: Position */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">What position do you play?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Pick the one that best describes you.</p>

            <div className="space-y-3">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => setPosition(pos.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    position === pos.value
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <span className={`font-medium ${position === pos.value ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {pos.label}
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

        {/* Step 2: Skill Level */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              How would you describe your current level?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">This helps us match you with the right coach.</p>

            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSkillLevel(level.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    skillLevel === level.value
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <div className={`font-medium ${skillLevel === level.value ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {level.sub}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{level.label}</div>
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

        {/* Step 3: Training Goals */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              What are you most looking to improve?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Pick up to 2 areas.</p>

            <div className="space-y-3">
              {TRAINING_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => toggleGoal(goal.value)}
                  className={`w-full p-4 rounded-[8px] border-2 text-left transition-all ${
                    goals.includes(goal.value)
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <span className={`font-medium ${goals.includes(goal.value) ? 'text-[#2563EB]' : 'text-gray-900 dark:text-gray-50'}`}>
                    {goal.label}
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
              When are you typically available to train?
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
              <Button fullWidth disabled={!canProceed()} onClick={handleFinish}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Summary screen — shown briefly before redirect */}
        {step === 5 && (
          <div className="bg-white dark:bg-gray-950 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-8 transition-colors duration-200 text-center">
            <div className="w-16 h-16 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Let&apos;s find your coach</h2>
            <div className="text-left space-y-2 mb-6 p-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Position:</span> {getLabel(position, POSITIONS)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Level:</span> {getLabel(skillLevel, SKILL_LEVELS)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Goals:</span> {goals.map((g) => getLabel(g, TRAINING_GOALS)).join(', ')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Availability:</span> {availability.map((a) => getLabel(a, AVAILABILITY_OPTIONS)).join(', ')}</p>
            </div>
            <Button fullWidth onClick={handleFinish}>
              Create Your Free Account
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}