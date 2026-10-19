import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Award
} from 'lucide-react'

export default function LoginPage() {
  const [tab, setTab] = useState('signin') // 'signin' | 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [shake, setShake] = useState(false)

  const { signIn, signUp, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // If already authenticated, redirect to destination or dashboard
  const destination = location.state?.from?.pathname || '/dashboard'
  if (isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    // Client-side validations
    if (!email || !password) {
      setErrorMessage('Please provide both work email and password.')
      triggerShake()
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      triggerShake()
      return
    }

    if (tab === 'signup' && !fullName.trim()) {
      setErrorMessage('Please provide your full name for staff onboarding.')
      triggerShake()
      return
    }

    setIsSubmitting(true)

    try {
      if (tab === 'signin') {
        await signIn({ email, password })
        navigate(destination, { replace: true })
      } else {
        await signUp({ email, password, fullName })
        setSuccessMessage('Account created successfully! Signing you in...')
        setTimeout(() => {
          navigate(destination, { replace: true })
        }, 1000)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.')
      triggerShake()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFillDemo = (demoEmail, demoName = '') => {
    setEmail(demoEmail)
    setPassword('BrightPath@2026')
    if (demoName) setFullName(demoName)
    setErrorMessage('')
  }

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-card-container ${shake ? 'shake-animation' : ''}`}>
        
        {/* Left Hero Sidebar: Institute Branding */}
        <div className="auth-card-hero">
          <div className="auth-hero-header">
            <div className="brand-icon-box" style={{ width: '42px', height: '42px' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="auth-hero-title">BrightPath CRM</div>
              <div className="auth-hero-subtitle">Admissions Management System</div>
            </div>
          </div>

          <div className="auth-hero-body">
            <div className="auth-hero-badge">
              <Award size={15} color="#2563eb" />
              <span>Coaching Institute Staff Portal</span>
            </div>
            <h2 className="auth-hero-heading">
              Streamline admissions, student callbacks, and conversion pipelines.
            </h2>
            <p className="auth-hero-desc">
              Empowering counsellors and academic coordinators to nurture student enquiries from initial contact to enrolled batch.
            </p>
          </div>

          <div className="auth-hero-features">
            <div className="auth-feature-row">
              <ShieldCheck size={18} color="#16a34a" />
              <span>Role-governed pipeline access (Admin, Manager, Counsellor)</span>
            </div>
            <div className="auth-feature-row">
              <CheckCircle2 size={18} color="#2563eb" />
              <span>Zero-loss overdue follow-up tracking</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-form-title">
              {tab === 'signin' ? 'Welcome Back' : 'Create Staff Profile'}
            </h1>
            <p className="auth-form-subtitle">
              {tab === 'signin'
                ? 'Sign in to access your assigned student leads and follow-up queues.'
                : 'Register your staff account to join your institute counselling team.'}
            </p>
          </div>

          {/* Interactive Sliding Tab Switcher */}
          <div className="auth-tab-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setTab('signin')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setTab('signup')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              Create Account
            </button>
            <div
              className="auth-tab-slider"
              style={{
                transform: tab === 'signin' ? 'translateX(0%)' : 'translateX(100%)'
              }}
            />
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="auth-alert-box error" role="alert">
              <AlertCircle size={18} className="auth-alert-icon" />
              <div className="auth-alert-text">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert-box success" role="alert">
              <CheckCircle2 size={18} className="auth-alert-icon" />
              <div className="auth-alert-text">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form-body">
            {tab === 'signup' && (
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="fullName">Full Name</label>
                <div className="auth-input-container">
                  <User size={18} className="auth-field-icon" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    className="auth-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-label" htmlFor="email">Work Email</label>
              <div className="auth-input-container">
                <Mail size={18} className="auth-field-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="counsellor@brightpath.edu"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="auth-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                {tab === 'signin' && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Min. 6 characters</span>
                )}
              </div>
              <div className="auth-input-container">
                <Lock size={18} className="auth-field-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>{tab === 'signin' ? 'Authenticating...' : 'Provisioning Account...'}</span>
                </>
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to Dashboard' : 'Complete Staff Registration'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill for Testing */}
          <div className="auth-demo-section">
            <span className="auth-demo-label">Quick Testing Credentials:</span>
            <div className="auth-demo-badges">
              <button
                type="button"
                className="auth-demo-pill"
                onClick={() => handleFillDemo('counsellor@brightpath.edu', 'Aditi Rao')}
              >
                Counsellor
              </button>
              <button
                type="button"
                className="auth-demo-pill"
                onClick={() => handleFillDemo('manager@brightpath.edu', 'Siddharth Roy')}
              >
                Manager
              </button>
              <button
                type="button"
                className="auth-demo-pill"
                onClick={() => handleFillDemo('admin@brightpath.edu', 'Director Mehta')}
              >
                Admin
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
