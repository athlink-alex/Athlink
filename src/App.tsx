import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { AthleteOnboarding } from './pages/AthleteOnboarding'
import { CoachOnboarding } from './pages/CoachOnboarding'
import { AthleteDashboard } from './pages/AthleteDashboard'
import { CoachDashboard } from './pages/CoachDashboard'
import { CoachDiscovery } from './pages/CoachDiscovery'
import { CoachProfile } from './pages/CoachProfile'
import { BookingFlow } from './pages/BookingFlow'
import { ReviewSubmission } from './pages/ReviewSubmission'
import { AdminDashboard } from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

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
