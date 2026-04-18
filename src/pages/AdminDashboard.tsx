import { useState, useEffect } from 'react'
import { supabase, type CoachProfile, type Booking, type Review } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatsRow } from '../components/ui/StatsRow'
import { AppLayout } from '../components/layout/AppLayout'

type Tab = 'verification' | 'payments' | 'analytics' | 'feedback'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('verification')
  const [pendingCoaches, setPendingCoaches] = useState<CoachProfile[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coachesResult, bookingsResult, reviewsResult] = await Promise.all([
          supabase.from('coach_profiles').select('*').eq('status', 'pending'),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        ])

        setPendingCoaches((coachesResult.data ?? []) as CoachProfile[])
        setBookings((bookingsResult.data ?? []) as Booking[])
        setReviews((reviewsResult.data ?? []) as Review[])
      } catch (err) {
        console.error('Error fetching admin data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const handleFlagReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ flagged: true })
      .eq('id', reviewId)

    if (error) {
      console.error('Error flagging review:', error)
      return
    }

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, flagged: true } : r))
    )
  }

  const tabs = [
    { id: 'verification' as Tab, label: 'Coach Verification', count: pendingCoaches.length },
    { id: 'payments' as Tab, label: 'Payment Oversight' },
    { id: 'analytics' as Tab, label: 'Booking Analytics' },
    { id: 'feedback' as Tab, label: 'Feedback Monitoring' },
  ]

  const completedBookings = bookings.filter(b => b.status === 'completed')
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0)
  const completionRate = bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0
  const activeUserIds = new Set(bookings.map(b => b.athlete_id))

  const analyticsStats = [
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Completion Rate', value: `${completionRate}%` },
    { label: 'Revenue', value: `$${(totalRevenue / 100).toFixed(2)}` },
    { label: 'Active Users', value: activeUserIds.size },
  ]

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-[#E5E7EB] dark:border-gray-700 mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Coach Verification Tab */}
        {activeTab === 'verification' && (
          <Card>
            <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Pending Coach Approvals</h2>
            </div>
            <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                </div>
              ) : pendingCoaches.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">No pending approvals</div>
              ) : (
                pendingCoaches.map((coach) => (
                  <div key={coach.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-50">{coach.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {coach.sport} &middot; {coach.experience_years || 0} years &middot; ${(coach.hourly_rate || 0) / 100}/hr
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Applied {coach.certifications_url ? 'with certifications' : '— no certifications'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRejectCoach(coach.id)}
                          className="text-[#DC2626] border-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveCoach(coach.id)}
                          className="bg-[#16A34A] hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Payment Oversight Tab */}
        {activeTab === 'payments' && (
          <Card>
            <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Payment Oversight</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No transactions found</td></tr>
                  ) : (
                    bookings.slice(0, 20).map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-50 font-mono">{booking.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-50">${(booking.amount / 100).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <Badge status={booking.status === 'scheduled' ? 'scheduled' : booking.status === 'completed' ? 'completed' : booking.status === 'disputed' ? 'disputed' : 'pending'} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${booking.payment_status === 'released' ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                            {booking.payment_status === 'released' ? 'Released' : 'Held'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div className="mb-8">
              <StatsRow stats={analyticsStats} />
            </div>
            <Card>
              <div className="p-6 border-b border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Booking Breakdown</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Bookings</span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">{bookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-medium text-[#16A34A]">{completedBookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
                  <span className="font-medium text-[#2563EB]">{bookings.filter(b => b.status === 'scheduled').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Disputed</span>
                  <span className="font-medium text-[#DC2626]">{bookings.filter(b => b.status === 'disputed').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
                  <span className="font-medium text-gray-500 dark:text-gray-400">{bookings.filter(b => b.status === 'cancelled').length}</span>
                </div>
                <div className="border-t border-[#E5E7EB] dark:border-gray-800 pt-4 flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-50">Total Revenue</span>
                  <span className="font-bold text-gray-900 dark:text-gray-50">${(totalRevenue / 100).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Feedback Monitoring Tab */}
        {activeTab === 'feedback' && (
          <Card>
            <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Reviews</h2>
            </div>
            <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">No reviews yet</div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-[#F59E0B]' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleFlagReview(review.id)}
                        disabled={review.flagged}
                        className={review.flagged
                          ? 'text-gray-400 border-gray-300 dark:border-gray-600 cursor-default'
                          : 'text-[#DC2626] border-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950'
                        }
                      >
                        {review.flagged ? 'Flagged' : 'Flag'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}