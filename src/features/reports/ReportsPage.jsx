import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  PieChart,
  Users,
  AlertTriangle,
  Layers,
  Compass
} from 'lucide-react'
import { fetchLeads, fetchTeamProfiles } from '../../services/leadsService.js'
import {
  fetchFollowUps,
  isFollowUpOverdue
} from '../../services/followUpsService.js'
import { useAuth } from '../../context/useAuth.js'

export default function ReportsPage() {
  const { profile } = useAuth()
  const userRole = profile?.role || 'counsellor'

  const [leads, setLeads] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load leads, follow-ups, and team profiles on mount
  useEffect(() => {
    let isMounted = true

    Promise.all([fetchLeads(), fetchFollowUps(), fetchTeamProfiles()])
      .then(([leadsData, followUpsData, teamData]) => {
        if (!isMounted) return
        setLeads(leadsData || [])
        setFollowUps(followUpsData || [])
        setTeamMembers(teamData || [])
        setError(null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('[ReportsPage] Error loading report metrics:', err)
        setError(err.message || 'Unable to connect to the database.')
        setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  // Retry action
  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    Promise.all([fetchLeads(), fetchFollowUps(), fetchTeamProfiles()])
      .then(([leadsData, followUpsData, teamData]) => {
        setLeads(leadsData || [])
        setFollowUps(followUpsData || [])
        setTeamMembers(teamData || [])
        setError(null)
      })
      .catch((err) => {
        console.error('[ReportsPage] Retry failed:', err)
        setError(err.message || 'Unable to connect to the database.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Feature 1: Status Distribution Calculation (Phase 8 logic)
  const statusDistribution = useMemo(() => {
    const total = leads.length
    const stages = [
      { key: 'New', label: '1. New Inquiries', color: 'var(--color-accent-blue)' },
      { key: 'Contacted', label: '2. Contacted', color: '#7e22ce' },
      { key: 'Qualified', label: '3. Qualified', color: '#b45309' },
      { key: 'Converted', label: '4. Converted Admissions', color: '#047857' },
      { key: 'Lost', label: '5. Lost Inquiries', color: '#be123c' }
    ]

    return stages.map((stage) => {
      const count = leads.filter((l) => l.status === stage.key).length
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      return {
        ...stage,
        count,
        pct
      }
    })
  }, [leads])

  // Feature 2: Lead Source Breakdown Calculation (Phase 8 logic)
  const sourceBreakdown = useMemo(() => {
    const total = leads.length
    const sourceMap = {}

    leads.forEach((l) => {
      const src = l.source || 'Direct Enquiry'
      if (!sourceMap[src]) {
        sourceMap[src] = { source: src, total: 0, converted: 0 }
      }
      sourceMap[src].total += 1
      if (l.status === 'Converted') {
        sourceMap[src].converted += 1
      }
    })

    return Object.values(sourceMap)
      .sort((a, b) => b.total - a.total)
      .map((s) => ({
        ...s,
        pct: total > 0 ? Math.round((s.total / total) * 100) : 0
      }))
  }, [leads])

  // Feature 3: Counsellor Workload Analysis Calculation
  // Role-scoped: Counsellor views personal workload; Managers/Admins view team
  const counsellorWorkload = useMemo(() => {
    const leadMap = {}
    const convertedMap = {}
    leads.forEach((l) => {
      const key = l.assigned_to || 'unassigned'
      leadMap[key] = (leadMap[key] || 0) + 1
      if (l.status === 'Converted') {
        convertedMap[key] = (convertedMap[key] || 0) + 1
      }
    })

    const pendingMap = {}
    const overdueMap = {}
    followUps.forEach((f) => {
      const key = f.assigned_to || 'unassigned'
      if (f.status === 'pending') {
        pendingMap[key] = (pendingMap[key] || 0) + 1
        if (isFollowUpOverdue(f)) {
          overdueMap[key] = (overdueMap[key] || 0) + 1
        }
      }
    })

    const team = teamMembers.map((member) => {
      const assigned = leadMap[member.id] || 0
      const converted = convertedMap[member.id] || 0
      const pending = pendingMap[member.id] || 0
      const overdue = overdueMap[member.id] || 0
      const rate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0'

      return {
        id: member.id,
        name: member.full_name,
        role: member.role,
        assigned,
        pending,
        overdue,
        converted,
        rate
      }
    })

    const unassignedCount = leadMap['unassigned'] || 0
    const unassignedPending = pendingMap['unassigned'] || 0
    const unassignedOverdue = overdueMap['unassigned'] || 0

    return {
      team,
      unassigned: unassignedCount > 0 ? {
        id: 'unassigned',
        name: 'Unassigned Leads',
        role: 'team pool',
        assigned: unassignedCount,
        pending: unassignedPending,
        overdue: unassignedOverdue,
        converted: convertedMap['unassigned'] || 0,
        rate: unassignedCount > 0 ? (((convertedMap['unassigned'] || 0) / unassignedCount) * 100).toFixed(0) : '0'
      } : null
    }
  }, [leads, followUps, teamMembers])

  // Personal metrics for Counsellor role
  const personalWorkload = useMemo(() => {
    const myId = profile?.id
    const myLeads = leads.filter((l) => l.assigned_to === myId)
    const myConverted = myLeads.filter((l) => l.status === 'Converted').length
    const myFollowUps = followUps.filter((f) => f.assigned_to === myId && f.status === 'pending')
    const myOverdue = myFollowUps.filter((f) => isFollowUpOverdue(f)).length
    const rate = myLeads.length > 0 ? ((myConverted / myLeads.length) * 100).toFixed(1) : '0.0'

    return {
      assigned: myLeads.length,
      pending: myFollowUps.length,
      overdue: myOverdue,
      converted: myConverted,
      conversionRate: rate
    }
  }, [leads, followUps, profile])

  const isTeamManager = userRole === 'manager' || userRole === 'admin'

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1>Reports & Pipeline Analytics</h1>
            <span className="dashboard-scope-pill">
              <Layers size={13} />
              <span>{isTeamManager ? 'Institute Analytics' : 'My Personal Performance'}</span>
            </span>
          </div>
          <p>Admissions funnel analysis, counsellor workload distribution, and channel conversion rates.</p>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="auth-alert-box error" style={{ marginBottom: '20px' }} role="alert">
          <AlertTriangle size={18} className="auth-alert-icon" />
          <div className="auth-alert-text">
            <strong>Unable to load report data:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRetry}
            style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main 3-Card Grid matching existing layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>

        {/* Card 1: Lead Status Distribution */}
        <div className="card" role="region" aria-label="Lead Status Distribution">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <TrendingUp size={20} color="var(--color-accent-blue)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Lead Status Distribution</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Progression of coaching leads across admissions stages ({leads.length} total).
          </p>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="list-skeleton-row skeleton-pulse" style={{ height: '32px' }} />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Compass size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-subtle)' }} />
              <span>No lead status data available yet.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {statusDistribution.map((stage) => (
                <div key={stage.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-main)' }}>{stage.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{stage.count}</strong> ({stage.pct}%)
                    </span>
                  </div>
                  <div
                    style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}
                    role="progressbar"
                    aria-valuenow={parseFloat(stage.pct)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`${stage.label}: ${stage.count} leads (${stage.pct}%)`}
                  >
                    <div
                      style={{
                        width: `${Math.max(parseFloat(stage.pct), stage.count > 0 ? 3 : 0)}%`,
                        height: '100%',
                        backgroundColor: stage.color,
                        transition: 'width 0.3s ease'
                      }}
                      title={`${stage.label}: ${stage.count} leads (${stage.pct}%)`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Lead Source Breakdown */}
        <div className="card" role="region" aria-label="Lead Source Breakdown">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <PieChart size={20} color="#7e22ce" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Lead Source Breakdown</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Inquiry volume and conversion across acquisition channels.
          </p>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1, 2, 3].map((k) => (
                <div key={k} className="list-skeleton-row skeleton-pulse" style={{ height: '36px' }} />
              ))}
            </div>
          ) : sourceBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <Compass size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-subtle)' }} />
              <span>No acquisition source records found.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sourceBreakdown.map((src) => (
                <div key={src.source} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{src.source}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      <strong>{src.total}</strong> ({src.pct}%) • <span style={{ color: 'var(--status-converted-text)', fontWeight: 600 }}>{src.converted} converted</span>
                    </span>
                  </div>
                  <div
                    style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}
                    role="progressbar"
                    aria-valuenow={src.pct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`${src.source}: ${src.total} leads (${src.pct}%)`}
                  >
                    <div
                      style={{
                        width: `${Math.max(src.pct, 4)}%`,
                        height: '100%',
                        backgroundColor: '#7e22ce',
                        transition: 'width 0.3s ease'
                      }}
                      title={`${src.source}: ${src.total} leads (${src.pct}%)`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Counsellor Workload Distribution */}
        <div className="card" role="region" aria-label="Counsellor Workload Analysis">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Users size={20} color="#047857" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Counsellor Workload Analysis</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {isTeamManager
              ? 'Team lead assignment, active follow-ups, and conversion productivity.'
              : 'Your personal coaching pipeline assignment and follow-up workload.'}
          </p>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((k) => (
                <div key={k} className="list-skeleton-row skeleton-pulse" style={{ height: '42px' }} />
              ))}
            </div>
          ) : !isTeamManager ? (
            /* Counsellor Personal View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-default)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Assigned Leads</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {personalWorkload.assigned}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Converted Students</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-converted-text)' }}>
                    {personalWorkload.converted}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Pending Callbacks</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-body)' }}>
                    {personalWorkload.pending}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Overdue Tasks</div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: personalWorkload.overdue > 0 ? 'var(--alert-danger-text)' : 'var(--text-muted)'
                    }}
                  >
                    {personalWorkload.overdue}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                Conversion Rate: <strong>{personalWorkload.conversionRate}%</strong>
              </div>
            </div>
          ) : (
            /* Manager / Admin Team View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {counsellorWorkload.team.length === 0 && !counsellorWorkload.unassigned ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No counsellor assignments found.
                </div>
              ) : (
                <>
                  {counsellorWorkload.team.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {member.role} • {member.assigned} leads ({member.converted} conv)
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }} title="Pending follow-ups">
                          {member.pending} pend
                        </span>
                        {member.overdue > 0 && (
                          <span
                            className="badge badge-overdue"
                            style={{ fontSize: '11px', padding: '1px 5px' }}
                            title={`${member.overdue} overdue callbacks`}
                          >
                            {member.overdue} od
                          </span>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--color-accent-blue)', minWidth: '32px', textAlign: 'right' }}>
                          {member.rate}%
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Unassigned Leads Row if any */}
                  {counsellorWorkload.unassigned && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--status-lost-bg)',
                        border: '1px solid var(--status-lost-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-lost-text)' }}>
                          {counsellorWorkload.unassigned.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Awaiting staff allocation
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-lost-text)' }}>
                        {counsellorWorkload.unassigned.assigned} leads
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
