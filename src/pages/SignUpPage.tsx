import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

type UserRole = 'athlete' | 'coach'

export function SignUpPage() {
  const [searchParams] = useSearchParams()
  const preselectedRole = searchParams.get('role') as UserRole | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole | null>(preselectedRole)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError('Please select a role')
      return
    }

    setError('')
    setLoading(true)

    const { error } = await signUp(email, password, role)

    if (error) {
      setError(error.message || 'Failed to create account')
      setLoading(false)
      return
    }

    if (role === 'athlete') {
      navigate('/onboarding/athlete')
    } else {
      navigate('/onboarding/coach')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <span className="text-3xl font-bold text-[#2563EB]">Athlink</span>
        </Link>
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Join Athlink and start your journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-950 py-8 px-4 shadow-sm rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 sm:px-10 transition-colors duration-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-[#DC2626] rounded-[8px] text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('athlete')}
                  className={`p-4 border-2 rounded-[8px] text-center transition-all cursor-pointer ${
                    role === 'athlete'
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <div className="text-2xl mb-2">&#127939;</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-50">Athlete / Parent</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Find a coach
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('coach')}
                  className={`p-4 border-2 rounded-[8px] text-center transition-all cursor-pointer ${
                    role === 'coach'
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-[#E5E7EB] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950'
                  }`}
                >
                  <div className="text-2xl mb-2">&#128104;&#8205;&#127891;</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-50">Coach</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Start coaching
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-600 dark:bg-gray-800 rounded-[8px] placeholder-gray-400 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#E5E7EB] dark:border-gray-600 dark:bg-gray-800 rounded-[8px] placeholder-gray-400 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters
                </p>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!role}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB] dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <Button variant="secondary" fullWidth>Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}