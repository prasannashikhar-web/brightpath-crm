import {
  UserPlus,
  RefreshCw,
  Edit3,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  AlertTriangle,
  RotateCcw,
  Tag,
  ArrowRight
} from 'lucide-react'
import {
  ACTIVITY_TYPES,
  formatActivityTime,
  formatFullDateTime
} from '../../services/activitiesService.js'

/**
 * Returns icon, visual theme class, and human title for an activity type.
 */
function getActivityMeta(type) {
  switch (type) {
    case ACTIVITY_TYPES.LEAD_CREATED:
      return {
        icon: UserPlus,
        badgeClass: 'timeline-badge-create',
        title: 'Lead Enrolled / Created'
      }
    case ACTIVITY_TYPES.STATUS_CHANGED:
      return {
        icon: RefreshCw,
        badgeClass: 'timeline-badge-status',
        title: 'Status Progression'
      }
    case ACTIVITY_TYPES.LEAD_UPDATED:
      return {
        icon: Edit3,
        badgeClass: 'timeline-badge-edit',
        title: 'Lead Information Updated'
      }
    case ACTIVITY_TYPES.FOLLOWUP_CREATED:
      return {
        icon: Calendar,
        badgeClass: 'timeline-badge-followup',
        title: 'Follow-up Scheduled'
      }
    case ACTIVITY_TYPES.FOLLOWUP_COMPLETED:
      return {
        icon: CheckCircle2,
        badgeClass: 'timeline-badge-complete',
        title: 'Follow-up Completed'
      }
    case ACTIVITY_TYPES.NOTE_ADDED:
      return {
        icon: FileText,
        badgeClass: 'timeline-badge-note',
        title: 'Counsellor Note Added'
      }
    default:
      return {
        icon: Clock,
        badgeClass: 'timeline-badge-default',
        title: 'Lead Activity'
      }
  }
}

/**
 * Helper to get status badge CSS class.
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'New': return 'badge-new'
    case 'Contacted': return 'badge-contacted'
    case 'Qualified': return 'badge-qualified'
    case 'Converted': return 'badge-converted'
    case 'Lost': return 'badge-lost'
    default: return 'badge-new'
  }
}

export default function ActivityTimeline({
  activities = [],
  isLoading = false,
  error = null,
  onRetry,
  onRefresh
}) {
  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="activity-timeline-wrapper" aria-busy="true" aria-label="Loading activity audit trail">
        <div className="timeline-skeleton-list">
          {[1, 2, 3].map((key) => (
            <div key={key} className="timeline-skeleton-item">
              <div className="skeleton-dot skeleton-pulse" />
              <div className="skeleton-card skeleton-pulse">
                <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton-line" style={{ width: '70%', height: '12px', marginBottom: '8px' }} />
                <div className="skeleton-line" style={{ width: '25%', height: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 2. Error State with Retry
  if (error) {
    return (
      <div className="activity-timeline-error" role="alert">
        <div className="auth-alert-box error" style={{ margin: 0 }}>
          <AlertTriangle size={18} className="auth-alert-icon" />
          <div className="auth-alert-text">
            <strong>Unable to load activity audit trail:</strong> {error}
          </div>
          {onRetry && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRetry}
              style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px' }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  // 3. Empty State
  if (!activities || activities.length === 0) {
    return (
      <div className="activity-timeline-empty">
        <div className="timeline-empty-icon-box">
          <Clock size={28} />
        </div>
        <h3 className="timeline-empty-title">No Activities Logged Yet</h3>
        <p className="timeline-empty-desc">
          Key lifecycle actions — including lead creation, status updates, follow-up completions, and counsellor edits — are automatically recorded here as an immutable audit trail.
        </p>
        {onRefresh && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRefresh}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', marginTop: '12px' }}
          >
            <RefreshCw size={14} />
            <span>Check for Updates</span>
          </button>
        )}
      </div>
    )
  }

  // 4. Chronological Timeline (Newest First)
  return (
    <div className="activity-timeline-wrapper">
      <div className="timeline-header-actions">
        <span className="timeline-count-label">
          {activities.length} recorded {activities.length === 1 ? 'event' : 'events'}
        </span>
        {onRefresh && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh activity timeline"
            style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div className="timeline-list">
        {activities.map((item, index) => {
          const meta = getActivityMeta(item.activity_type)
          const Icon = meta.icon
          const relativeTime = formatActivityTime(item.created_at)
          const fullDateTime = formatFullDateTime(item.created_at)
          const isLast = index === activities.length - 1
          const actorName = item.actor?.full_name || 'System / Automated'
          const actorRole = item.actor?.role

          return (
            <div key={item.id || index} className={`timeline-entry ${isLast ? 'is-last' : ''}`}>
              {/* Timeline Connector Line */}
              {!isLast && <div className="timeline-connector" />}

              {/* Icon Marker */}
              <div className={`timeline-marker ${meta.badgeClass}`} title={meta.title}>
                <Icon size={14} />
              </div>

              {/* Content Card */}
              <div className="timeline-content-card">
                <div className="timeline-entry-header">
                  <div className="timeline-entry-title-group">
                    <span className="timeline-entry-type-tag">{meta.title}</span>
                    <span className="timeline-entry-desc">{item.description}</span>
                  </div>

                  {/* Timestamp */}
                  <time
                    className="timeline-timestamp"
                    dateTime={item.created_at}
                    title={fullDateTime}
                  >
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {relativeTime}
                  </time>
                </div>

                {/* Structured Metadata Badges & Notes */}
                {item.metadata && (
                  <div className="timeline-entry-metadata">
                    {/* Status Changed details */}
                    {item.activity_type === ACTIVITY_TYPES.STATUS_CHANGED && (
                      <div className="timeline-meta-status-flow">
                        {item.metadata.previous_status && (
                          <>
                            <span className={`status-badge-sm ${getStatusBadgeClass(item.metadata.previous_status)}`}>
                              {item.metadata.previous_status}
                            </span>
                            <ArrowRight size={12} color="var(--text-muted)" />
                          </>
                        )}
                        <span className={`status-badge-sm ${getStatusBadgeClass(item.metadata.new_status)}`}>
                          {item.metadata.new_status || 'Updated'}
                        </span>

                        {item.metadata.lost_reason && (
                          <div className="timeline-meta-alert-reason">
                            <strong>Reason:</strong> {item.metadata.lost_reason}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lead Created details */}
                    {item.activity_type === ACTIVITY_TYPES.LEAD_CREATED && (
                      <div className="timeline-meta-chips">
                        {item.metadata.course_interest && (
                          <span className="timeline-meta-chip">
                            <Tag size={11} />
                            Course: {item.metadata.course_interest}
                          </span>
                        )}
                        {item.metadata.source && (
                          <span className="timeline-meta-chip">
                            Source: {item.metadata.source}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Follow-up Scheduled details */}
                    {item.activity_type === ACTIVITY_TYPES.FOLLOWUP_CREATED && item.metadata.note && (
                      <div className="timeline-meta-quote">
                        <Calendar size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-accent-blue)' }} />
                        <span className="timeline-meta-quote-text">
                          <strong>Objective:</strong> {item.metadata.note}
                        </span>
                      </div>
                    )}

                    {/* Follow-up Completed details */}
                    {item.activity_type === ACTIVITY_TYPES.FOLLOWUP_COMPLETED && item.metadata.outcome_note && (
                      <div className="timeline-meta-quote completed">
                        <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--alert-success-text)' }} />
                        <span className="timeline-meta-quote-text">
                          <strong>Outcome:</strong> {item.metadata.outcome_note}
                        </span>
                      </div>
                    )}

                    {/* Reopened Alert */}
                    {item.metadata.is_reopened && (
                      <div className="timeline-meta-reopen-badge">
                        <RotateCcw size={12} />
                        <span>Lead Reopened from Lost status</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Responsible Actor Attribution */}
                <div className="timeline-entry-footer">
                  <div className="timeline-actor-pill">
                    <div className="timeline-actor-avatar">
                      {actorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="timeline-actor-name">{actorName}</span>
                    {actorRole && (
                      <span className="timeline-actor-role-badge">
                        {actorRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
