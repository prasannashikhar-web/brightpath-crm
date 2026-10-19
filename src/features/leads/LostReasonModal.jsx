import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertOctagon, X, Check, AlertCircle } from 'lucide-react'

const LOST_REASON_CATEGORIES = [
  'Course fees or budget constraint',
  'Enrolled in another institute',
  'Batch schedule or timing mismatch',
  'Unable to reach or invalid phone number',
  'Not interested or changed career plans',
  'Location or travel distance',
  'Other reason'
]

/**
 * Accessible Modal for collecting mandatory lost reason when marking a lead as Lost.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose - Cancels and leaves status unchanged
 * @param {(reason: string) => Promise<void>|void} props.onConfirm - Submits the valid lost reason
 * @param {boolean} props.isSubmitting
 * @param {string} [props.leadName]
 */
export default function LostReasonModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  leadName = 'this student'
}) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [otherText, setOtherText] = useState('')
  const [error, setError] = useState('')

  const dialogRef = useRef(null)
  const otherInputRef = useRef(null)

  const handleClose = useCallback(() => {
    setSelectedCategory('')
    setOtherText('')
    setError('')
    onClose()
  }, [onClose])

  // ESC key handler & focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, handleClose])

  // Auto focus textarea when "Other reason" is selected
  useEffect(() => {
    if (selectedCategory === 'Other reason') {
      otherInputRef.current?.focus()
    }
  }, [selectedCategory])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!selectedCategory) {
      setError('Please select a reason for marking this lead as Lost.')
      return
    }

    if (selectedCategory === 'Other reason') {
      const trimmed = otherText.trim()
      if (!trimmed) {
        setError('Please provide a specific explanation for why the lead was lost.')
        return
      }
      if (trimmed.length < 5) {
        setError('Explanation must be at least 5 characters long.')
        return
      }
      onConfirm(`Other: ${trimmed}`)
    } else {
      onConfirm(selectedCategory)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!isSubmitting) handleClose()
      }}
      role="presentation"
    >
      <div
        className="modal-dialog lost-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lost-modal-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--status-lost-bg)',
                color: 'var(--status-lost-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertOctagon size={20} />
            </div>
            <div>
              <h2 id="lost-modal-title" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Mark Lead as Lost
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Specify reason for <strong style={{ color: 'var(--text-main)' }}>{leadName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cancel and close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px 24px' }}>
            <div
              style={{
                backgroundColor: 'var(--status-lost-bg)',
                border: '1px solid var(--status-lost-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '13px',
                color: 'var(--status-lost-text)',
                lineHeight: 1.45
              }}
            >
              <strong>Mandatory Lost Reason:</strong> A non-blank reason is required by database policy. You can reopen this lead anytime to <code>Contacted</code> if circumstances change.
            </div>

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

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '10px'
                }}
              >
                Select Primary Reason <span style={{ color: 'var(--alert-danger-text)' }}>*</span>
              </label>

              <div
                role="radiogroup"
                aria-label="Lost reason categories"
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {LOST_REASON_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategory === cat
                  return (
                    <label
                      key={cat}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: isChecked
                          ? '1.5px solid var(--status-lost-text)'
                          : '1px solid var(--border-default)',
                        backgroundColor: isChecked ? 'var(--status-lost-bg)' : 'var(--bg-surface)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <input
                        type="radio"
                        name="lostReasonCategory"
                        value={cat}
                        checked={isChecked}
                        onChange={() => {
                          setSelectedCategory(cat)
                          setError('')
                        }}
                        disabled={isSubmitting}
                        style={{ accentColor: 'var(--status-lost-text)', width: '16px', height: '16px' }}
                      />
                      <span
                        style={{
                          fontSize: '13.5px',
                          color: isChecked ? 'var(--status-lost-text)' : 'var(--text-main)',
                          fontWeight: isChecked ? 600 : 500
                        }}
                      >
                        {cat}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Custom explanation if "Other reason" is chosen */}
            {selectedCategory === 'Other reason' && (
              <div className="form-group" style={{ marginTop: '14px', marginBottom: '4px' }}>
                <label
                  htmlFor="other-lost-reason-text"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '6px'
                  }}
                >
                  Specific Details <span style={{ color: 'var(--alert-danger-text)' }}>*</span>
                </label>
                <textarea
                  id="other-lost-reason-text"
                  ref={otherInputRef}
                  className="form-control"
                  rows={3}
                  value={otherText}
                  onChange={(e) => {
                    setOtherText(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Provide specific context (e.g., Student opted for commerce stream instead)..."
                  disabled={isSubmitting}
                  maxLength={300}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Minimum 5 characters required</span>
                  <span>{otherText.length}/300</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}
          >
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
              className="btn btn-danger"
              disabled={isSubmitting}
              style={{
                backgroundColor: 'var(--status-lost-text)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirm Lost Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
