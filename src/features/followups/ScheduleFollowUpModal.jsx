import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  Check,
  Sparkles,
  Lock
} from 'lucide-react'
import { createFollowUp } from '../../services/followUpsService.js'

// Quick time helpers
function getIsoLocalDateTime(offsetHours = 2, targetHour = null) {
  const d = new Date()
  if (targetHour !== null) {
    d.setHours(targetHour, 0, 0, 0)
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1)
    }
  } else {
    d.setHours(d.getHours() + offsetHours)
  }

  // Format to YYYY-MM-DDTHH:mm for datetime-local
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${mins}`
}

function getTomorrowMorning() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T10:00`
}

function getInTwoDays() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  d.setHours(10, 0, 0, 0)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T10:00`
}

function getNextMonday() {
  const d = new Date()
  const dayOfWeek = d.getDay()
  const daysUntilMonday = ((8 - dayOfWeek) % 7) || 7
  d.setDate(d.getDate() + daysUntilMonday)
  d.setHours(10, 0, 0, 0)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T10:00`
}

export default function ScheduleFollowUpModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedLead = null,
  availableLeads = [],
  teamMembers = [],
  currentUser = null,
  userRole = 'counsellor'
}) {
  const [selectedLeadId, setSelectedLeadId] = useState(() => preselectedLead?.id || '')
  const [dueAt, setDueAt] = useState(() => getTomorrowMorning())
  const [note, setNote] = useState('')
  const [assignedTo, setAssignedTo] = useState(() => {
    if (preselectedLead?.assigned_to) return preselectedLead.assigned_to
    if (userRole === 'counsellor' && currentUser?.id) return currentUser.id
    return 'unassigned'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const dialogRef = useRef(null)
  const isElevated = userRole === 'admin' || userRole === 'manager'

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    setError('')
    onClose()
  }, [isSubmitting, onClose])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const targetLeadId = preselectedLead ? preselectedLead.id : selectedLeadId
    if (!targetLeadId) {
      setError('Please select a student lead.')
      return
    }

    if (!dueAt) {
      setError('Please select a scheduled date and time.')
      return
    }

    if (!note.trim()) {
      setError('Please write an objective or note for this follow-up.')
      return
    }

    if (note.trim().length < 3) {
      setError('Note must be at least 3 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createFollowUp({
        leadId: targetLeadId,
        dueAt,
        note: note.trim(),
        assignedTo: isElevated ? assignedTo : (currentUser?.id || null),
        currentUserId: currentUser?.id
      })

      onSuccess(created)
      onClose()
    } catch (err) {
      console.error('[ScheduleFollowUpModal] error:', err)
      setError(err.message || 'Failed to schedule follow-up.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-accent-light)',
                color: 'var(--color-accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h2 id="schedule-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Schedule Student Follow-up
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Set a reminder callback, campus visit, or counselling session
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px 24px' }}>
            {error && (
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
                <span>{error}</span>
              </div>
            )}

            {/* Target Student */}
            {preselectedLead ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Student Lead
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {preselectedLead.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {preselectedLead.phone} • {preselectedLead.course_interest}
                  </div>
                </div>
                <span className="badge badge-contacted" style={{ fontSize: '11px' }}>
                  {preselectedLead.status}
                </span>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="followup-lead-select"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}
                >
                  <User size={14} color="var(--text-muted)" />
                  <span>Select Student Lead <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
                </label>
                <select
                  id="followup-lead-select"
                  className="form-control"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">-- Choose a student from active leads --</option>
                  {availableLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.phone}) - {l.course_interest} [{l.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date & Time Picker */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label
                htmlFor="followup-datetime"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}
              >
                <Clock size={14} color="var(--text-muted)" />
                <span>Scheduled Date & Time <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
              </label>
              <input
                id="followup-datetime"
                type="datetime-local"
                className="form-control"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={isSubmitting}
                required
                style={{ fontWeight: 600 }}
              />

              {/* Quick Preset Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => setDueAt(getIsoLocalDateTime(2))}
                  disabled={isSubmitting}
                >
                  <Sparkles size={11} />
                  <span>+2 Hours</span>
                </button>
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => setDueAt(getTomorrowMorning())}
                  disabled={isSubmitting}
                >
                  <span>Tomorrow 10 AM</span>
                </button>
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => setDueAt(getInTwoDays())}
                  disabled={isSubmitting}
                >
                  <span>In 2 Days</span>
                </button>
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => setDueAt(getNextMonday())}
                  disabled={isSubmitting}
                >
                  <span>Next Monday</span>
                </button>
              </div>
            </div>

            {/* Assignee (Role Governed) */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label
                htmlFor="followup-assignee"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}
              >
                <User size={14} color="var(--text-muted)" />
                <span>Assigned Counsellor</span>
              </label>

              {isElevated ? (
                <select
                  id="followup-assignee"
                  className="form-control"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="unassigned">-- Unassigned --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={currentUser?.user_metadata?.full_name || currentUser?.email || 'Self (Counsellor)'}
                    disabled
                    style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed', paddingRight: '32px' }}
                  />
                  <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '10px' }} />
                </div>
              )}
            </div>

            {/* Note / Objective */}
            <div className="form-group" style={{ marginBottom: '4px' }}>
              <label
                htmlFor="followup-note"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}
              >
                <FileText size={14} color="var(--text-muted)" />
                <span>Discussion Objective / Note <span style={{ color: 'var(--alert-danger-text)' }}>*</span></span>
              </label>
              <textarea
                id="followup-note"
                className="form-control"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Call parent to share fee structure discount details and confirm Saturday demo class..."
                disabled={isSubmitting}
                maxLength={1000}
                required
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>{note.length}/1000</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Schedule Follow-up</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
