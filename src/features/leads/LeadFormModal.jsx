import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  BookOpen,
  Share2,
  FileText,
  AlertCircle,
  Loader2,
  AlertTriangle,
  UserCheck
} from 'lucide-react'
import { validateLeadForm, createLead } from '../../services/leadsService'
import { useAuth } from '../../context/useAuth'

const DEFAULT_COURSES = [
  'JEE Advanced (2-Year)',
  'NEET Comprehensive (1-Year)',
  'Foundation (Class 9-10)',
  'Full Stack Web Development',
  'Data Science & Machine Learning',
  'Other'
]

const SOURCES = [
  'Website Form',
  'Walk-in Campus',
  'Google Ads',
  'Social Media (Instagram/LinkedIn)',
  'Student Referral',
  'Inbound Phone Call',
  'Education Fair'
]

export default function LeadFormModal({ isOpen, onClose, onSuccess, teamMembers = [] }) {
  const { user, profile, role } = useAuth()

  // Initialize form state
  const [formData, setFormData] = useState(() => ({
    full_name: '',
    phone: '',
    email: '',
    course_interest: DEFAULT_COURSES[0],
    custom_course: '',
    source: SOURCES[0],
    assigned_to: role === 'counsellor' ? (user?.id || 'unassigned') : 'unassigned',
    notes: ''
  }))

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const modalRef = useRef(null)
  const firstInputRef = useRef(null)

  // Focus first input on mount
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Determine whether any field has been touched/edited
  const isDirty = Boolean(
    formData.full_name ||
    formData.phone ||
    formData.email ||
    (formData.course_interest && formData.course_interest !== DEFAULT_COURSES[0]) ||
    formData.notes
  )

  // Handle Close with dirty state check
  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  // Keyboard accessibility: Escape key and Tab focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false)
        } else {
          handleRequestClose()
        }
      }

      // Simple focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstEl = focusableElements[0]
        const lastEl = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showDiscardConfirm, handleRequestClose])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field-specific error on edit
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const courseToSubmit =
      formData.course_interest === 'Other'
        ? formData.custom_course.trim()
        : formData.course_interest

    const payload = {
      ...formData,
      course_interest: courseToSubmit
    }

    // Client-side validation
    const { isValid, errors: validationErrors } = validateLeadForm(payload)
    if (!isValid) {
      setErrors(validationErrors)
      // Focus first error field
      const firstKey = Object.keys(validationErrors)[0]
      const el = document.getElementById(`field-${firstKey}`)
      el?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createLead(payload, user, role)
      if (onSuccess) {
        onSuccess(created)
      }
      onClose()
    } catch (err) {
      console.error('[LeadFormModal] Creation failed:', err)
      setSubmitError(err.message || 'Unable to save lead. Please check network and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleRequestClose}
      role="presentation"
    >
      <div
        className="modal-dialog"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 id="lead-modal-title" className="modal-title">Capture New Student Lead</h2>
            <p className="modal-subtitle">Record enquiry details, course preference, and initial counsellor assignment.</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleRequestClose}
            aria-label="Close modal dialog"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Error Alert */}
        {submitError && (
          <div className="auth-alert-box error" style={{ margin: '16px 24px 0' }} role="alert">
            <AlertCircle size={18} className="auth-alert-icon" />
            <div className="auth-alert-text">{submitError}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="modal-form">
          <div className="modal-body-scrollable">
            {/* Student Full Name */}
            <div className="form-group">
              <label htmlFor="field-full_name" className="form-label required">
                Student Full Name
              </label>
              <div className={`form-input-box ${errors.full_name ? 'error' : ''}`}>
                <User size={16} className="form-field-icon" />
                <input
                  id="field-full_name"
                  ref={firstInputRef}
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  className="form-input"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.full_name && <span className="form-error-text">{errors.full_name}</span>}
            </div>

            {/* Mobile Number & Email (2 columns on tablet/desktop) */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="field-phone" className="form-label required">
                  Mobile Number
                </label>
                <div className={`form-input-box ${errors.phone ? 'error' : ''}`}>
                  <Phone size={16} className="form-field-icon" />
                  <input
                    id="field-phone"
                    type="tel"
                    required
                    placeholder="e.g. 98765 43210"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone ? (
                  <span className="form-error-text">{errors.phone}</span>
                ) : (
                  <span className="form-hint-text">10-digit Indian or international format</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="field-email" className="form-label">
                  Email Address <span className="optional-tag">(Optional)</span>
                </label>
                <div className={`form-input-box ${errors.email ? 'error' : ''}`}>
                  <Mail size={16} className="form-field-icon" />
                  <input
                    id="field-email"
                    type="email"
                    placeholder="student@example.com"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <span className="form-error-text">{errors.email}</span>}
              </div>
            </div>

            {/* Course Interest & Lead Source */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="field-course_interest" className="form-label required">
                  Course of Interest
                </label>
                <div className="form-input-box">
                  <BookOpen size={16} className="form-field-icon" />
                  <select
                    id="field-course_interest"
                    className="form-select"
                    value={formData.course_interest}
                    onChange={(e) => handleChange('course_interest', e.target.value)}
                    disabled={isSubmitting}
                  >
                    {DEFAULT_COURSES.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.course_interest === 'Other' && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      id="field-custom_course"
                      type="text"
                      placeholder="Specify course title..."
                      className="form-input custom-course-input"
                      value={formData.custom_course}
                      onChange={(e) => handleChange('custom_course', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.course_interest && (
                      <span className="form-error-text">{errors.course_interest}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="field-source" className="form-label required">
                  Acquisition Source
                </label>
                <div className="form-input-box">
                  <Share2 size={16} className="form-field-icon" />
                  <select
                    id="field-source"
                    className="form-select"
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    disabled={isSubmitting}
                  >
                    {SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Counsellor Assignment (Role-governed) */}
            <div className="form-group">
              <label htmlFor="field-assigned_to" className="form-label">
                Assigned Counsellor
              </label>

              {role === 'counsellor' ? (
                /* Counsellor Role: Locked to Self */
                <div className="locked-assignee-box">
                  <UserCheck size={16} color="#16a34a" />
                  <div>
                    <span className="locked-assignee-name">
                      {profile?.full_name || 'You (Counsellor)'}
                    </span>
                    <span className="locked-assignee-hint">
                      (Automatically assigned to your personal pipeline)
                    </span>
                  </div>
                </div>
              ) : (
                /* Manager or Admin Role: Selectable Dropdown + Unassigned Option */
                <div className="form-input-box">
                  <UserCheck size={16} className="form-field-icon" />
                  <select
                    id="field-assigned_to"
                    className="form-select"
                    value={formData.assigned_to}
                    onChange={(e) => handleChange('assigned_to', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="unassigned">-- Unassigned (Admissions Pool) --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Initial Notes */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="field-notes" className="form-label" style={{ margin: 0 }}>
                  Initial Notes & Questions <span className="optional-tag">(Optional)</span>
                </label>
                <span className="char-count">{formData.notes.length}/1000</span>
              </div>
              <div className="form-input-box textarea-box">
                <FileText size={16} className="form-field-icon" style={{ marginTop: '10px' }} />
                <textarea
                  id="field-notes"
                  rows={3}
                  maxLength={1000}
                  placeholder="Record student's academic background, preferred batch timing, or parent expectations..."
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.notes && <span className="form-error-text">{errors.notes}</span>}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRequestClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Saving Lead...</span>
                </>
              ) : (
                <span>Create Lead Record</span>
              )}
            </button>
          </div>
        </form>

        {/* Dirty Form Discard Confirmation Alert Overlay */}
        {showDiscardConfirm && (
          <div className="confirm-overlay" role="alertdialog" aria-modal="true">
            <div className="confirm-box">
              <div className="confirm-icon-box">
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              <h3 className="confirm-title">Discard unsaved lead?</h3>
              <p className="confirm-desc">
                You have entered enquiry information. If you close now, your progress will be lost.
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  className="btn btn-primary confirm-discard-btn"
                  onClick={() => {
                    setShowDiscardConfirm(false)
                    onClose()
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
