import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Clock,
  History,
  AlertOctagon,
  Edit3,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  FileQuestion,
  UserCheck
} from 'lucide-react'
import {
  fetchLeadById,
  updateLeadStatus,
  updateLeadDetails
} from '../../services/leadsService.js'
import { useAuth } from '../../context/useAuth.js'
import DetailSkeleton from '../../components/common/DetailSkeleton.jsx'
import StatusPipelineBar from './StatusPipelineBar.jsx'
import LostReasonModal from './LostReasonModal.jsx'
import EditLeadModal from './EditLeadModal.jsx'

// Helper to format full date-time strings
function formatDateTime(isoString) {
  if (!isoString) return 'Not available'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return isoString
  }
}

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const userRole = profile?.role || 'counsellor'

  const [lead, setLead] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorState, setErrorState] = useState(null) // { type: 'NOT_FOUND' | 'NETWORK', message: string }

  // Action states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isLostModalOpen, setIsLostModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Feedback notifications
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message: string }
  const [copiedField, setCopiedField] = useState(null) // 'phone' | 'id'

  // Pre-flight derived UUID check
  const isInvalidFormat = !id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // Fetch lead data asynchronously in effect
  useEffect(() => {
    if (isInvalidFormat) return

    let isMounted = true

    fetchLeadById(id)
      .then((data) => {
        if (!isMounted) return
        setLead(data)
        setErrorState(null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        if (err.code === 'NOT_FOUND' || err.message?.includes('not found') || err.message?.includes('denied')) {
          setErrorState({
            type: 'NOT_FOUND',
            message: 'The student lead record could not be found or you do not have permission to view it.'
          })
        } else {
          setErrorState({
            type: 'NETWORK',
            message: err.message || 'Unable to connect to the database. Please check your network and try again.'
          })
        }
        setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [id, isInvalidFormat])

  const handleManualRetry = () => {
    setIsLoading(true)
    setErrorState(null)
    fetchLeadById(id)
      .then((data) => {
        setLead(data)
        setErrorState(null)
      })
      .catch((err) => {
        if (err.code === 'NOT_FOUND' || err.message?.includes('not found') || err.message?.includes('denied')) {
          setErrorState({
            type: 'NOT_FOUND',
            message: 'The student lead record could not be found or you do not have permission to view it.'
          })
        } else {
          setErrorState({
            type: 'NETWORK',
            message: err.message || 'Unable to connect to the database. Please check your network and try again.'
          })
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timer = setTimeout(() => setFeedback(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Copy helper
  const handleCopy = (text, field) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }).catch((err) => {
      console.warn('Copy failed:', err)
    })
  }

  // Handle stage change (e.g. New -> Contacted -> Qualified -> Converted)
  const handleStageClick = async (targetStage) => {
    if (!lead || isUpdatingStatus) return

    setIsUpdatingStatus(true)
    setFeedback(null)

    try {
      const updated = await updateLeadStatus(lead.id, targetStage, null)
      setLead(updated)
      setFeedback({
        type: 'success',
        message: `Lead status successfully updated to "${targetStage}".`
      })
    } catch (err) {
      console.error('[LeadDetailPage] handleStageClick error:', err)
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update lead status. Please try again.'
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle marking lead as Lost with mandatory reason
  const handleConfirmLost = async (reason) => {
    if (!lead || isUpdatingStatus) return

    setIsUpdatingStatus(true)
    setFeedback(null)

    try {
      const updated = await updateLeadStatus(lead.id, 'Lost', reason)
      setLead(updated)
      setIsLostModalOpen(false)
      setFeedback({
        type: 'success',
        message: 'Lead has been marked as Lost.'
      })
    } catch (err) {
      console.error('[LeadDetailPage] handleConfirmLost error:', err)
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record lost status.'
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle Reopening a Lost Lead
  // Confirmed decision: Reopens with default status Contacted and clears lost_reason to NULL
  const handleReopenLead = async () => {
    if (!lead || isUpdatingStatus) return

    setIsUpdatingStatus(true)
    setFeedback(null)

    try {
      // Explicitly sets status to Contacted and clears lost_reason
      const updated = await updateLeadStatus(lead.id, 'Contacted', null)
      setLead(updated)
      setFeedback({
        type: 'success',
        message: 'Lead reopened successfully and moved to "Contacted" status.'
      })
    } catch (err) {
      console.error('[LeadDetailPage] handleReopenLead error:', err)
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to reopen lead.'
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle Saving Edited Lead Information
  const handleSaveEdit = async (formValues) => {
    if (!lead) return

    setIsSavingEdit(true)
    try {
      const updated = await updateLeadDetails(lead.id, formValues, userRole)
      setLead(updated)
      setIsEditModalOpen(false)
      setFeedback({
        type: 'success',
        message: 'Lead information updated successfully.'
      })
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Helper for Status Badge Class
  const getBadgeClass = (status) => {
    switch (status) {
      case 'New': return 'badge-new'
      case 'Contacted': return 'badge-contacted'
      case 'Qualified': return 'badge-qualified'
      case 'Converted': return 'badge-converted'
      case 'Lost': return 'badge-lost'
      default: return 'badge-new'
    }
  }

  // 1. Invalid ID format
  if (isInvalidFormat) {
    return (
      <div className="lead-detail-error-container">
        <div style={{ marginBottom: '18px' }}>
          <Link
            to="/leads"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', gap: '6px' }}
          >
            <ArrowLeft size={15} />
            <span>Back to Leads Pipeline</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '580px', margin: '40px auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-lost-bg)',
              color: 'var(--status-lost-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <ShieldAlert size={32} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Invalid Reference ID
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
            The requested lead ID is not a valid reference format.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/leads')}
            >
              Return to Pipeline
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Loading State
  if (isLoading) {
    return <DetailSkeleton />
  }

  // 3. Error States (Not Found or Network error)
  if (errorState) {
    const isNotFound = errorState.type === 'NOT_FOUND'

    return (
      <div className="lead-detail-error-container">
        <div style={{ marginBottom: '18px' }}>
          <Link
            to="/leads"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', gap: '6px' }}
          >
            <ArrowLeft size={15} />
            <span>Back to Leads Pipeline</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '580px', margin: '40px auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isNotFound ? 'var(--status-lost-bg)' : 'var(--alert-warning-bg)',
              color: isNotFound ? 'var(--status-lost-text)' : 'var(--alert-warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            {isNotFound ? <FileQuestion size={32} /> : <AlertCircle size={32} />}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            {isNotFound ? 'Lead Not Found' : 'Connection Error'}
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
            {errorState.message}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/leads')}
            >
              Return to Pipeline
            </button>
            {errorState.type === 'NETWORK' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleManualRetry}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={15} />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!lead) return null

  const isLost = lead.status === 'Lost'

  return (
    <div className="lead-detail-page">
      {/* Top Navigation */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/leads"
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Leads Pipeline</span>
        </Link>
      </div>

      {/* Actionable Feedback Banner */}
      {feedback && (
        <div
          className={`detail-feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            className="feedback-dismiss-btn"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header detail-page-header">
        <div className="page-header-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {lead.full_name}
            </h1>
            <span className={`badge ${getBadgeClass(lead.status)}`} style={{ fontSize: '13px', padding: '4px 10px' }}>
              {lead.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Lead Reference:</span>
            <code style={{ fontSize: '12px', color: 'var(--text-body)', backgroundColor: 'var(--bg-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              {lead.id}
            </code>
            <button
              type="button"
              className="copy-icon-btn"
              onClick={() => handleCopy(lead.id, 'id')}
              title="Copy Lead ID"
              aria-label="Copy Lead ID"
            >
              {copiedField === 'id' ? <Check size={13} color="var(--alert-success-text)" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit3 size={15} />
            <span>Edit Information</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            title="Follow-up scheduling will be fully enabled in Phase 6"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.85 }}
          >
            <Calendar size={15} />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Interactive Status Pipeline Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <StatusPipelineBar
          currentStatus={lead.status}
          onStageClick={handleStageClick}
          onMarkLostClick={() => setIsLostModalOpen(true)}
          onReopenClick={handleReopenLead}
          isUpdating={isUpdatingStatus}
        />
      </div>

      {/* Prominent Lost Reason Banner (Visible when lead is Lost) */}
      {isLost && (
        <div className="lost-alert-banner" role="alert">
          <div className="lost-alert-icon-box">
            <AlertOctagon size={22} />
          </div>
          <div className="lost-alert-content">
            <div className="lost-alert-title">
              Student Lead Marked as Lost
            </div>
            <div className="lost-alert-reason">
              <strong>Recorded Reason:</strong> {lead.lost_reason || 'No specific reason recorded.'}
            </div>
          </div>
          <div className="lost-alert-action">
            <button
              type="button"
              className="btn btn-secondary reopen-action-btn"
              onClick={handleReopenLead}
              disabled={isUpdatingStatus}
              title="Reopen lead and set status to Contacted"
            >
              <RotateCcw size={15} />
              <span>Reopen as Contacted</span>
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Cards Grid */}
      <div className="lead-detail-grid">
        {/* Card 1: Student Profile & Academic Choices */}
        <div className="card detail-info-card">
          <div className="detail-card-header">
            <h2 className="detail-card-title">Student Profile & Interest</h2>
          </div>

          <div className="detail-info-list">
            <div className="detail-info-row">
              <span className="info-label">
                <User size={15} color="var(--text-muted)" />
                <span>Full Name</span>
              </span>
              <span className="info-value font-semibold">{lead.full_name}</span>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <Phone size={15} color="var(--text-muted)" />
                <span>Mobile Phone</span>
              </span>
              <div className="info-value-with-actions">
                <a
                  href={`tel:${lead.phone}`}
                  className="quick-contact-link"
                  title={`Call ${lead.phone}`}
                >
                  {lead.phone}
                </a>
                <button
                  type="button"
                  className="copy-pill-btn"
                  onClick={() => handleCopy(lead.phone, 'phone')}
                  title="Copy Phone Number"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check size={12} color="var(--alert-success-text)" />
                      <span style={{ color: 'var(--alert-success-text)' }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <Mail size={15} color="var(--text-muted)" />
                <span>Email Address</span>
              </span>
              <span className="info-value">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="quick-contact-link">
                    {lead.email}
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Not provided</span>
                )}
              </span>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <BookOpen size={15} color="var(--text-muted)" />
                <span>Target Course</span>
              </span>
              <span className="info-value highlight-badge">{lead.course_interest}</span>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <ExternalLink size={15} color="var(--text-muted)" />
                <span>Enquiry Source</span>
              </span>
              <span className="info-value">{lead.source}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Assignment & Ownership Details */}
        <div className="card detail-info-card">
          <div className="detail-card-header">
            <h2 className="detail-card-title">Assignment & Ownership</h2>
          </div>

          <div className="detail-info-list">
            <div className="detail-info-row">
              <span className="info-label">
                <UserCheck size={15} color="var(--text-muted)" />
                <span>Assigned Counsellor</span>
              </span>
              <div className="info-value">
                {lead.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="assignee-avatar-sm">
                      {lead.assignee.full_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13.5px' }}>
                        {lead.assignee.full_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {lead.assignee.role?.toUpperCase()} • {lead.assignee.email || ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </div>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <User size={15} color="var(--text-muted)" />
                <span>Created By</span>
              </span>
              <span className="info-value">
                {lead.creator ? (
                  <span>
                    <strong>{lead.creator.full_name}</strong>{' '}
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      ({lead.creator.role})
                    </span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>System / Admin</span>
                )}
              </span>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <Clock size={15} color="var(--text-muted)" />
                <span>Created At</span>
              </span>
              <span className="info-value" style={{ fontSize: '13px' }}>
                {formatDateTime(lead.created_at)}
              </span>
            </div>

            <div className="detail-info-row">
              <span className="info-label">
                <RotateCcw size={15} color="var(--text-muted)" />
                <span>Last Updated</span>
              </span>
              <span className="info-value" style={{ fontSize: '13px' }}>
                {formatDateTime(lead.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Counsellor Notes & Observations */}
      <div className="card" style={{ marginTop: '20px', padding: '20px 24px' }}>
        <h2 className="detail-card-title" style={{ marginBottom: '12px' }}>
          Counsellor Notes & Academic Background
        </h2>
        {lead.notes ? (
          <div className="lead-notes-box">
            {lead.notes}
          </div>
        ) : (
          <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
            No internal notes recorded yet. Click "Edit Information" above to add counsellor notes, parent preferences, or academic history.
          </div>
        )}
      </div>

      {/* Future Phases Tab Shell: Follow-ups & Activity History */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-default)', padding: '0 24px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-accent-blue)', borderBottom: '2px solid var(--color-accent-blue)', paddingBottom: '12px' }}>
            <Clock size={16} />
            <span>Follow-ups (Phase 6)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', paddingBottom: '12px', cursor: 'not-allowed' }}>
            <History size={16} />
            <span>Activity Trail (Phase 7)</span>
          </div>
        </div>

        <div style={{ padding: '24px', backgroundColor: 'var(--bg-surface-subtle)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
            <Calendar size={18} color="var(--color-accent-blue)" />
            <span>
              Follow-up reminders, scheduled calls, overdue alerts, and date-pickers will be fully integrated into this tab during <strong>Phase 6</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LostReasonModal
        key={isLostModalOpen ? 'lost-open' : 'lost-closed'}
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        onConfirm={handleConfirmLost}
        isSubmitting={isUpdatingStatus}
        leadName={lead.full_name}
      />

      <EditLeadModal
        key={lead.id + (isEditModalOpen ? '-open' : '-closed')}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
        userRole={userRole}
        onSave={handleSaveEdit}
        isSaving={isSavingEdit}
      />
    </div>
  )
}
