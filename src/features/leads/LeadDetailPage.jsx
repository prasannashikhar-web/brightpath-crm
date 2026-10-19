import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Clock,
  History,
  AlertOctagon
} from 'lucide-react'

export default function LeadDetailPage() {
  const { id } = useParams()

  return (
    <div>
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

      <div className="page-header">
        <div className="page-header-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Student Lead Record</h1>
            <span className="badge badge-contacted">Contacted</span>
          </div>
          <p>Lead Reference ID: <code>{id}</code></p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" title="Enabled in Phase 4">
            Edit Information
          </button>
          <button type="button" className="btn btn-primary" title="Enabled in Phase 6">
            <Calendar size={15} />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Grid: Lead Info + Status Pipeline Progression */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Student Profile & Academic Interest
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <User size={16} color="var(--text-muted)" />
              <strong style={{ width: '110px', color: 'var(--text-muted)' }}>Full Name:</strong>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Aarav Sharma</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <Phone size={16} color="var(--text-muted)" />
              <strong style={{ width: '110px', color: 'var(--text-muted)' }}>Contact:</strong>
              <span style={{ color: 'var(--text-main)' }}>+91 98765 43210</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <Mail size={16} color="var(--text-muted)" />
              <strong style={{ width: '110px', color: 'var(--text-muted)' }}>Email:</strong>
              <span style={{ color: 'var(--text-main)' }}>aarav.sharma@example.com</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <BookOpen size={16} color="var(--text-muted)" />
              <strong style={{ width: '110px', color: 'var(--text-muted)' }}>Target Course:</strong>
              <span style={{ color: 'var(--text-main)' }}>JEE Advanced 2-Year Program</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Pipeline Progression & Lost Guard (Phase 4)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Phase 4 will enable quick status transitions with strict validation for the mandatory <code>lost_reason</code>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-new">1. New</span>
              <span className="badge badge-contacted">2. Contacted (Current)</span>
              <span className="badge badge-qualified">3. Qualified</span>
              <span className="badge badge-converted">4. Converted</span>
            </div>
            <div style={{ marginTop: '10px', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--alert-danger-bg)', border: '1px solid var(--alert-danger-border)', fontSize: '13px', color: 'var(--alert-danger-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={16} />
              <span>Mandatory Lost Reason validation enforced upon marking as Lost.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Shell: Follow-ups & Activity History */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-accent-blue)', borderBottom: '2px solid var(--color-accent-blue)', paddingBottom: '12px', marginBottom: '-13px' }}>
            <Clock size={16} />
            <span>Follow-ups (Phase 6)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
            <History size={16} />
            <span>Activity Audit Trail (Phase 7)</span>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Detailed follow-up scheduling, overdue alerts, and chronological activity timeline will be integrated in upcoming feature phases.
        </p>
      </div>
    </div>
  )
}
