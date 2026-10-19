import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Users, ArrowUpRight } from 'lucide-react'

export default function LeadsListPage() {
  const samplePipelineRows = [
    {
      id: 'demo-lead-1',
      name: 'Aarav Sharma',
      phone: '+91 98765 43210',
      email: 'aarav.sharma@example.com',
      course: 'JEE Advanced',
      source: 'Website Form',
      status: 'New',
      badgeClass: 'badge-new'
    },
    {
      id: 'demo-lead-2',
      name: 'Ananya Verma',
      phone: '+91 98123 45678',
      email: 'ananya.v@example.com',
      course: 'NEET Comprehensive',
      source: 'Google Ads',
      status: 'Contacted',
      badgeClass: 'badge-contacted'
    },
    {
      id: 'demo-lead-3',
      name: 'Rohan Iyer',
      phone: '+91 97654 32109',
      email: 'rohan.iyer@example.com',
      course: 'Class 10 Foundation',
      source: 'Walk-in Referral',
      status: 'Qualified',
      badgeClass: 'badge-qualified'
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title-box">
          <h1>Leads Pipeline</h1>
          <p>Track, filter, and advance coaching enquiries across admission stages.</p>
        </div>
        <div>
          <button type="button" className="btn btn-primary" title="Enabled in Phase 3">
            <Plus size={16} />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Shell Preview */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-subtle)',
              flex: '1 1 240px'
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Search by student name, phone, email, course...
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--text-body)',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <Filter size={15} color="var(--text-muted)" />
            <span>Filters: Status, Source, Counsellor</span>
          </div>
        </div>
      </div>

      {/* Leads Table / Card Shell */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--color-accent-blue)" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
              Pipeline Table Shell (Ready for Phase 3 Data Binding)
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing 3 sample previews</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Student Name</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Phone & Email</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Target Course</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {samplePipelineRows.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-main)' }}>{lead.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-body)' }}>
                    <div>{lead.phone}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.email}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-body)' }}>{lead.course}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${lead.badgeClass}`}>{lead.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <Link
                      to={`/leads/${lead.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <span>Details</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
