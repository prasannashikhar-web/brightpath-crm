import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardPage from './features/dashboard/DashboardPage'
import LeadsListPage from './features/leads/LeadsListPage'
import LeadDetailPage from './features/leads/LeadDetailPage'
import FollowUpsPage from './features/followups/FollowUpsPage'
import ReportsPage from './features/reports/ReportsPage'
import LoginPage from './features/auth/LoginPage'
import NotFoundPage from './components/common/NotFoundPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Public Authentication Route */}
            <Route path="login" element={<LoginPage />} />

            {/* Protected Routes (Secured by Supabase Auth Session) */}
            <Route element={<ProtectedRoute />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="leads" element={<LeadsListPage />} />
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="follow-ups" element={<FollowUpsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
