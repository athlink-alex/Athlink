import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Tab = 'verification' | 'payments' | 'analytics' | 'feedback'

interface Coach {
  id: string
  name: string
  sport: string
  experience_years: number
  hourly_rate: number
  status: string
  created_at: string
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('verification')
  const [pendingCoaches, setPendingCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPendingCoaches = async () => {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('status', 'pending')

      if (error) {
        console.error('Error fetching coaches:', error)
        return
      }

      setPendingCoaches(data || [])
      setLoading(false)
    }

    fetchPendingCoaches()
  }, [])

  const handleApproveCoach = async (coachId: string) => {
    const { error } = await supabase
      .from('coach_profiles')
      .update({ status: 'approved' })
      .eq('id', coachId)

    if (error) {
      console.error('Error approving coach:', error)
      return
    }

    setPendingCoaches((prev) => prev.filter((c) => c.id !== coachId))
  }

  const handleRejectCoach = async (coachId: string) => {
    const { error } = await supabase
      .from('coach_profiles')
      .update({ status: 'rejected' })
      .eq('id', coachId)

    if (error) {
      console.error('Error rejecting coach:', error)
      return
    }

    setPendingCoaches((prev) => prev.filter((c) => c.id !== coachId))
  }

  const tabs = [
    { id: 'verification' as Tab, label: 'Coach Verification', count: pendingCoaches.length },
    { id: 'payments' as Tab, label: 'Payment Oversight' },
    { id: 'analytics' as Tab, label: 'Analytics' },
    { id: 'feedback' as Tab, label: 'Feedback' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Athlink
            </Link>
            <span className="text-sm text-gray-600">Admin Dashboard</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'verification' && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pending Coach Approvals</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-6 text-center">Loading...</div>
                ) : pendingCoaches.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No pending approvals</div>
                ) : (
                  pendingCoaches.map((coach) => (
                    <div key={coach.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{coach.name}</p>
                          <p className="text-sm text-gray-500">
                            {coach.sport} • {coach.experience_years} years • ${(coach.hourly_rate || 0) / 100}/hr
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Applied {new Date(coach.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectCoach(coach.id)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveCoach(coach.id)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Oversight</h2>
              <p className="text-gray-500">Payment management coming soon.</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Analytics</h2>
              <p className="text-gray-500">Analytics dashboard coming soon.</p>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Feedback</h2>
              <p className="text-gray-500">Feedback monitoring coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
