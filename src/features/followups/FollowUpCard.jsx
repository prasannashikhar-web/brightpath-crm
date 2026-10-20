import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Check,
  User,
  ArrowUpRight,
  BookOpen
} from 'lucide-react'
import { formatFollowUpTiming } from '../../services/followUpsService.js'

export default function FollowUpCard({
  followUp,
  onComplete,
  isCompleting = false
}) {
  const [showCompletePrompt, setShowCompletePrompt] = useState(false)
  const [outcomeNote, setOutcomeNote] = useState('')

  const isPending = followUp.status === 'pending'
  const isCompleted = followUp.status === 'completed'
  const timing = formatFollowUpTiming(followUp.due_at, followUp.status)
  const isOverdue = timing.isOverdue

  const handleConfirmComplete = async () => {
    await onComplete(followUp.id, outcomeNote)
    setShowCompletePrompt(false)
    setOutcomeNote('')
  }

  return (
    <div
      className={`followup-card ${isOverdue ? 'followup-card-overdue' : ''} ${isCompleted ? 'followup-card-completed' : ''}`}
      role="article"
      aria-label={`Follow-up for ${followUp.lead?.full_name || 'student'}`}
    >
      {/* Top Header */}
      <div className="followup-card-header">
        <div className="followup-student-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {followUp.lead ? (
              <Link
                to={`/leads/${followUp.lead_id}`}
                className="followup-student-name-link"
                title="View student lead details"
              >
                <span>{followUp.lead.full_name}</span>
                <ArrowUpRight size={13} />
              </Link>
            ) : (
              <span className="followup-student-name">Unknown Student</span>
            )}

            {followUp.lead?.status && (
              <span className="badge badge-new" style={{ fontSize: '11px', padding: '1px 7px' }}>
                {followUp.lead.status}
              </span>
            )}
          </div>

          {followUp.lead?.course_interest && (
            <div className="followup-course-tag">
              <BookOpen size={12} />
              <span>{followUp.lead.course_interest}</span>
            </div>
          )}
        </div>

        {/* Due / Overdue Badge */}
        <div className="followup-timing-slot">
          {isOverdue ? (
            <span className="badge badge-overdue" title="Immediate action required">
              <AlertTriangle size={12} />
              <span>{timing.label}</span>
            </span>
          ) : isCompleted ? (
            <span className="badge badge-converted">
              <CheckCircle2 size={12} />
              <span>Completed</span>
            </span>
          ) : (
            <span className={`badge ${timing.isToday ? 'badge-qualified' : 'badge-contacted'}`}>
              <Clock size={12} />
              <span>{timing.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* Discussion Objective / Note */}
      <div className="followup-note-box">
        <p className="followup-note-text">{followUp.note}</p>
      </div>

      {/* Footer Info: Phone, Assignee & Complete Action */}
      <div className="followup-card-footer">
        <div className="followup-meta-group">
          {followUp.lead?.phone && (
            <a
              href={`tel:${followUp.lead.phone}`}
              className="quick-call-btn"
              title={`Call ${followUp.lead.phone}`}
            >
              <Phone size={13} />
              <span>{followUp.lead.phone}</span>
            </a>
          )}

          {followUp.assignee?.full_name && (
            <span className="followup-assignee-text">
              <User size={13} color="var(--text-muted)" />
              <span>{followUp.assignee.full_name}</span>
            </span>
          )}
        </div>

        {/* Complete Action Button */}
        {isPending && !showCompletePrompt && (
          <button
            type="button"
            className="btn btn-secondary followup-complete-trigger"
            onClick={() => setShowCompletePrompt(true)}
            disabled={isCompleting}
            title="Mark this follow-up interaction as complete"
          >
            <Check size={14} />
            <span>Mark Complete</span>
          </button>
        )}
      </div>

      {/* Inline Completion Prompt with Outcome Note */}
      {showCompletePrompt && (
        <div className="followup-complete-prompt">
          <label
            htmlFor={`outcome-note-${followUp.id}`}
            style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}
          >
            Interaction Outcome (Optional):
          </label>
          <input
            id={`outcome-note-${followUp.id}`}
            type="text"
            className="form-control"
            value={outcomeNote}
            onChange={(e) => setOutcomeNote(e.target.value)}
            placeholder="e.g. Parent requested fee breakdown, demo class booked for Saturday..."
            disabled={isCompleting}
            style={{ fontSize: '12.5px', marginBottom: '8px' }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCompletePrompt(false)}
              disabled={isCompleting}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmComplete}
              disabled={isCompleting}
              style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              {isCompleting ? (
                <>
                  <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>Confirm Complete</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
