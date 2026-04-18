import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

export function QRCodePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user) return
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, name, sport, subscription_tier, hourly_rate, avg_rating')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    setLoading(false)
  }

  const profileUrl = profile
    ? `${window.location.origin}/coaches/${profile.id}`
    : ''

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `athlink-${profile?.name?.replace(/\s+/g, '-').toLowerCase() || 'coach'}-qr.png`
      a.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="qrcode">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">QR Code Card</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share your coach profile</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/coach')}
                className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
              >
                &larr; Dashboard
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
              </div>
            ) : profile ? (
              <>
                {/* Profile Card with QR */}
                <Card className="p-6 text-center mb-6">
                  <div className="mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-[#2563EB] font-bold text-xl">
                        {profile.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{profile.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.sport} Coach
                      {profile.hourly_rate ? ` · $${(profile.hourly_rate / 100).toFixed(0)}/session` : ''}
                    </p>
                    {profile.avg_rating && (
                      <p className="text-sm text-[#F59E0B] mt-1">
                        {'★'.repeat(Math.round(profile.avg_rating))} ({profile.avg_rating.toFixed(1)})
                      </p>
                    )}
                  </div>

                  <div ref={qrRef} className="flex justify-center mb-4 bg-white p-4 rounded-[8px] inline-block mx-auto">
                    <QRCodeSVG
                      value={profileUrl}
                      size={180}
                      level="H"
                      includeMargin={false}
                      fgColor="#1E293B"
                    />
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 break-all mb-4">
                    {profileUrl}
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download QR
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </Card>

                {/* Usage Tips */}
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">How to use your QR code</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563EB] font-bold">1.</span>
                      Print this QR code on business cards or flyers
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563EB] font-bold">2.</span>
                      Athletes scan it to view your profile and book sessions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#2563EB] font-bold">3.</span>
                      Display it at training facilities or events
                    </li>
                  </ul>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Could not load profile.</p>
              </Card>
            )}
          </div>
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}