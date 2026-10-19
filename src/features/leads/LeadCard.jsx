import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Copy, Check, ArrowUpRight, User, BookOpen } from 'lucide-react'

// Helper for relative/compact date formatting
function formatLeadDate(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    const now = new Date()
    const diffMs = now - d
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function LeadCard({ lead }) {
  const [copied, setCopied] = useState(false)

  const handleCopyPhone = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const badgeClassMap = {
    New: 'badge-new',
    Contacted: 'badge-contacted',
    Qualified: 'badge-qualified',
    Converted: 'badge-converted',
    Lost: 'badge-lost'
  }
  const badgeClass = badgeClassMap[lead.status] || 'badge-new'

  const assigneeName = lead.assignee?.full_name || 'Unassigned'
  const isUnassigned = !lead.assigned_to

  return (
    <div className="lead-mobile-card">
      <div className="lead-card-header">
        <div className="lead-card-title-box">
          <span className="lead-card-name">{lead.full_name}</span>
          <span className="lead-card-date">{formatLeadDate(lead.created_at)}</span>
        </div>
        <span className={`badge ${badgeClass}`}>{lead.status}</span>
      </div>

      <div className="lead-card-meta">
        <div className="lead-card-course">
          <BookOpen size={14} color="var(--color-accent-blue)" />
          <span>{lead.course_interest}</span>
        </div>
        <span className="lead-card-source-dot">•</span>
        <span className="lead-card-source">{lead.source}</span>
      </div>

      <div className="lead-card-details">
        <div className="lead-card-assignee">
          <User size={13} color="var(--text-muted)" />
          {isUnassigned ? (
            <span className="assignee-pill unassigned">Unassigned</span>
          ) : (
            <span className="assignee-pill assigned">{assigneeName}</span>
          )}
        </div>
        {lead.email && (
          <span className="lead-card-email" title={lead.email}>{lead.email}</span>
        )}
      </div>

      {/* Action Strip */}
      <div className="lead-card-actions">
        <a
          href={`tel:${lead.phone.replace(/\s+/g, '')}`}
          className="btn btn-secondary lead-card-action-btn"
          title={`Call ${lead.phone}`}
        >
          <Phone size={14} color="var(--color-accent-blue)" />
          <span>Call</span>
        </a>

        <button
          type="button"
          onClick={handleCopyPhone}
          className="btn btn-secondary lead-card-action-btn"
          title="Copy phone number"
        >
          {copied ? (
            <>
              <Check size={14} color="#16a34a" />
              <span style={{ color: '#16a34a' }}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} color="var(--text-muted)" />
              <span>Copy</span>
            </>
          )}
        </button>

        <Link
          to={`/leads/${lead.id}`}
          className="btn btn-primary lead-card-action-btn"
          style={{ flexGrow: 1.2 }}
        >
          <span>View Details</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}
