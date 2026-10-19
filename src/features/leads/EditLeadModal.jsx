import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Check,
  User,
  Phone,
  Mail,
  BookOpen,
  Share2,
  FileText,
  AlertCircle,
  Lock
} from 'lucide-react'
import {
  validateLeadForm,
  normalizePhone,
  fetchTeamProfiles
} from '../../services/leadsService.js'

const COURSES = [
  'JEE Advanced 2-Year Program',
  'NEET Medical Intensive',
  'Foundation Class 10 (Maths & Science)',
  'Foundation Class 9 (Maths & Science)',
  'Crash Course JEE/NEET Revision',
  'State Board Olympiad Preparatory'
]

const SOURCES = [
  'Website Enquiry',
  'Walk-in / Campus Visit',
  'Google Search / Ad',
  'Meta / Instagram Ad',
  'Student / Parent Referral',
  'School Outreach Seminar',
  'Education Fair / Expo',
  'Direct Phone Call'
]

/**
 * Modal to edit existing lead information.
 * Counsellors can update contact, course, source, and notes.
 * Managers/Admins can additionally reassign the lead.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {object} props.lead
 * @param {string} props.userRole
 * @param {(updatedLead: object) => Promise<void>|void} props.onSave
 * @param {boolean} props.isSaving
 */
export default function EditLeadModal({
  isOpen,
  onClose,
  lead,
  userRole = 'counsellor',
  onSave,
  isSaving = false
}) {
  const [formData, setFormData] = useState(() => ({
    full_name: lead?.full_name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    course_interest: lead?.course_interest || '',
    source: lead?.source || '',
    notes: lead?.notes || '',
    assigned_to: lead?.assigned_to || 'unassigned'
  }))

  const [teamMembers, setTeamMembers] = useState([])
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const dialogRef = useRef(null)
  const initialDataRef = useRef({
    full_name: lead?.full_name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    course_interest: lead?.course_interest || '',
    source: lead?.source || '',
    notes: lead?.notes || '',
    assigned_to: lead?.assigned_to || 'unassigned'
  })

  const isElevated = userRole === 'admin' || userRole === 'manager'

  const handleAttemptClose = useCallback(() => {
    if (isDirty && !isSaving) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }, [isDirty, isSaving, onClose])

  // Load team profiles for assignee dropdown if elevated role
  useEffect(() => {
    if (isOpen && isElevated) {
      let isMounted = true
      fetchTeamProfiles().then((profiles) => {
        if (isMounted) setTeamMembers(profiles)
      }).catch((err) => {
        console.warn('Failed to load team profiles for edit modal:', err)
      })
      return () => { isMounted = false }
    }
  }, [isOpen, isElevated])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) {
        handleAttemptClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, handleAttemptClose])

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      // Check if dirty
      const changed = Object.keys(next).some((k) => next[k] !== initialDataRef.current[k])
      setIsDirty(changed)
      return next
    })

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handlePhoneBlur = () => {
    if (formData.phone) {
      const formatted = normalizePhone(formData.phone)
      handleFieldChange('phone', formatted)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const { isValid, errors: validationErrors } = validateLeadForm(formData)
    if (!isValid) {
      setErrors(validationErrors)
      return
    }

    try {
      await onSave({
        ...formData,
        phone: normalizePhone(formData.phone)
      })
    } catch (err) {
      setServerError(err.message || 'Failed to update lead information.')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!isSaving) handleAttemptClose()
      }}
      role="presentation"
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-lead-modal-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 id="edit-lead-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Edit Student Details
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Modify contact information, course choice, and counselor notes
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={handleAttemptClose}
            disabled={isSaving}
            aria-label="Cancel and close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px 24px' }}>
            {serverError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--alert-danger-bg)',
                  border: '1px solid var(--alert-danger-border)',
                  color: 'var(--alert-danger-text)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
                role="alert"
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Student Full Name */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="edit-lead-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                <User size={15} color="var(--text-muted)" />
                <span>Student Full Name <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
              </label>
              <input
                id="edit-lead-name"
                type="text"
                className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                value={formData.full_name}
                onChange={(e) => handleFieldChange('full_name', e.target.value)}
                placeholder="e.g. Aarav Sharma"
                disabled={isSaving}
                required
              />
              {errors.full_name && <span className="field-error-text">{errors.full_name}</span>}
            </div>

            {/* Contact Row: Phone & Email */}
            <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="form-group">
                <label htmlFor="edit-lead-phone" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  <Phone size={15} color="var(--text-muted)" />
                  <span>Mobile Phone <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
                </label>
                <input
                  id="edit-lead-phone"
                  type="tel"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="e.g. 9876543210"
                  disabled={isSaving}
                  required
                />
                {errors.phone && <span className="field-error-text">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edit-lead-email" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <span>Email Address</span>
                </label>
                <input
                  id="edit-lead-email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="e.g. aarav@example.com"
                  disabled={isSaving}
                />
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>
            </div>

            {/* Program & Source Row */}
            <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div className="form-group">
                <label htmlFor="edit-lead-course" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  <BookOpen size={15} color="var(--text-muted)" />
                  <span>Target Course <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
                </label>
                <select
                  id="edit-lead-course"
                  className={`form-control ${errors.course_interest ? 'is-invalid' : ''}`}
                  value={formData.course_interest}
                  onChange={(e) => handleFieldChange('course_interest', e.target.value)}
                  disabled={isSaving}
                  required
                >
                  <option value="">Select Target Course</option>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {/* If custom existing course not in predefined list */}
                  {formData.course_interest && !COURSES.includes(formData.course_interest) && (
                    <option value={formData.course_interest}>{formData.course_interest}</option>
                  )}
                </select>
                {errors.course_interest && <span className="field-error-text">{errors.course_interest}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edit-lead-source" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  <Share2 size={15} color="var(--text-muted)" />
                  <span>Lead Source <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
                </label>
                <select
                  id="edit-lead-source"
                  className={`form-control ${errors.source ? 'is-invalid' : ''}`}
                  value={formData.source}
                  onChange={(e) => handleFieldChange('source', e.target.value)}
                  disabled={isSaving}
                  required
                >
                  <option value="">Select Origin Source</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {formData.source && !SOURCES.includes(formData.source) && (
                    <option value={formData.source}>{formData.source}</option>
                  )}
                </select>
                {errors.source && <span className="field-error-text">{errors.source}</span>}
              </div>
            </div>

            {/* Counsellor Assignment (Role Governed) */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="edit-lead-assignee" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                <User size={15} color="var(--text-muted)" />
                <span>Assigned Counsellor</span>
              </label>

              {isElevated ? (
                <div>
                  <select
                    id="edit-lead-assignee"
                    className="form-control"
                    value={formData.assigned_to}
                    onChange={(e) => handleFieldChange('assigned_to', e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="unassigned">-- Unassigned --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    As a {userRole}, you can reassign this lead to any team counsellor.
                  </span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={lead?.assignee?.full_name || 'Unassigned'}
                    disabled
                    style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed', paddingRight: '32px' }}
                  />
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '10px' }} />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Only Managers and Admins can reassign leads.
                  </span>
                </div>
              )}
            </div>

            {/* Counsellor Internal Notes */}
            <div className="form-group" style={{ marginBottom: '4px' }}>
              <label htmlFor="edit-lead-notes" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                <FileText size={15} color="var(--text-muted)" />
                <span>Counsellor Notes / Academic History</span>
              </label>
              <textarea
                id="edit-lead-notes"
                className="form-control"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Add important student academic background, test scores, or parent contact preferences..."
                disabled={isSaving}
                maxLength={1000}
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>{formData.notes.length}/1000</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAttemptClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSaving ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Discard confirmation overlay */}
        {showDiscardConfirm && (
          <div className="confirm-overlay" role="presentation">
            <div className="confirm-box" role="alertdialog" aria-modal="true" style={{ maxWidth: '380px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Discard Unsaved Changes?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.45 }}>
                You have modified lead details. If you exit now, your changes will not be saved.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Continue Editing
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setShowDiscardConfirm(false)
                    onClose()
                  }}
                  style={{ backgroundColor: 'var(--alert-danger-text)', color: '#ffffff' }}
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
