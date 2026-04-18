import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { AthleteQuestionnaire } from './pages/AthleteQuestionnaire'
import { CoachQuestionnaire } from './pages/CoachQuestionnaire'
import { AthleteOnboarding } from './pages/AthleteOnboarding'
import { CoachOnboarding } from './pages/CoachOnboarding'
import { AthleteDashboard } from './pages/AthleteDashboard'
import { CoachDashboard } from './pages/CoachDashboard'
import { CoachDiscovery } from './pages/CoachDiscovery'
import { CoachProfile } from './pages/CoachProfile'
import { BookingFlow } from './pages/BookingFlow'
import { ReviewSubmission } from './pages/ReviewSubmission'
import { AdminDashboard } from './pages/AdminDashboard'
import { PricingPage } from './pages/PricingPage'
import { PublicReport } from './pages/PublicReport'
import CoachApply from './pages/CoachApply'

// Athlete Dashboard Pages
import { AthleteCalendar } from './pages/dashboard/athlete/Calendar'

// Coach Dashboard Pages
import { AIAssistant } from './pages/dashboard/coach/AIAssistant'
import { MyAthletes } from './pages/dashboard/coach/MyAthletes'
import { AthleteDetail } from './pages/dashboard/coach/AthleteDetail'
import { CoachCalendar } from './pages/dashboard/coach/Calendar'
import { SessionNotes } from './pages/dashboard/coach/SessionNotes'
import { Messages } from './pages/dashboard/coach/Messages'
import { Revenue } from './pages/dashboard/coach/Revenue'
import { QRCodePage } from './pages/dashboard/coach/QRCode'
import { OnlineCoaching } from './pages/dashboard/coach/OnlineCoaching'
import { Analytics } from './pages/dashboard/coach/Analytics'
import { ProgressReports } from './pages/dashboard/coach/ProgressReports'
import { Subscription } from './pages/dashboard/coach/Subscription'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/get-started/athlete" element={<AthleteQuestionnaire />} />
          <Route path="/get-started/coach" element={<CoachQuestionnaire />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/coaches/apply" element={<CoachApply />} />
          <Route path="/reports/:token" element={<PublicReport />} />

          {/* Athlete routes */}
          <Route
            path="/onboarding/athlete"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/athlete"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/athlete/calendar"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coaches"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <CoachDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coaches/:id"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <CoachProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:coachId"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <BookingFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <ReviewSubmission />
              </ProtectedRoute>
            }
          />

          {/* Coach routes */}
          <Route
            path="/onboarding/coach"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/assistant"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/athletes"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <MyAthletes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/athletes/:id"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <AthleteDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/calendar"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <CoachCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/athletes/:id/notes"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <SessionNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/messages"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/revenue"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <Revenue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/qrcode"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <QRCodePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/online"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <OnlineCoaching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/analytics"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/reports"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <ProgressReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/subscription"
            element={
              <ProtectedRoute allowedRoles={['coach', 'approved_coach']}>
                <Subscription />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App