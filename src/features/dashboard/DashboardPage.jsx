import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Sparkles,
  Award,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Phone,
  ChevronRight,
  CheckCircle2,
  Tag,
  Clock,
  Layers,
  Compass
} from 'lucide-react'
import { fetchLeads } from '../../services/leadsService.js'
import {
  fetchFollowUps,
  isFollowUpOverdue,
  formatFollowUpTiming
} from '../../services/followUpsService.js'
import { formatActivityTime } from '../../services/activitiesService.js'
import { useAuth } from '../../context/useAuth.js'

export default function DashboardPage() {
  const { profile } = useAuth()
  const userRole = profile?.role || 'counsellor'

  const [leads, setLeads] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Load all dashboard metrics permitted by RLS on mount
  useEffect(() => {
    let isMounted = true

    Promise.all([fetchLeads(), fetchFollowUps()])
      .then(([leadsData, followUpsData]) => {
        if (!isMounted) return
        setLeads(leadsData || [])
        setFollowUps(followUpsData || [])
        setError(null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('[DashboardPage] Failed to fetch metrics:', err)
        setError(err.message || 'Unable to connect to the database. Please try again.')
        setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  // Manual refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const [leadsData, followUpsData] = await Promise.all([
        fetchLeads(),
        fetchFollowUps()
      ])
      setLeads(leadsData || [])
      setFollowUps(followUpsData || [])
    } catch (err) {
      console.error('[DashboardPage] Refresh failed:', err)
      setError(err.message || 'Failed to refresh data.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Retry after error
  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    Promise.all([fetchLeads(), fetchFollowUps()])
      .then(([leadsData, followUpsData]) => {
        setLeads(leadsData || [])
        setFollowUps(followUpsData || [])
        setError(null)
      })
      .catch((err) => {
        console.error('[DashboardPage] Retry failed:', err)
        setError(err.message || 'Unable to connect to the database.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Compute live KPIs, distribution segments, sources, and urgent lists
  const {
    totalLeads,
    newLeadsCount,
    convertedLeadsCount,
    overdueFollowUpsCount,
    conversionRate,
    statusSegments,
    sourceBreakdown,
    urgentOverdueList,
    recentEnquiriesList
  } = useMemo(() => {
    const total = leads.length
    const newCount = leads.filter((l) => l.status === 'New').length
    const contacted = leads.filter((l) => l.status === 'Contacted').length
    const qualified = leads.filter((l) => l.status === 'Qualified').length
    const converted = leads.filter((l) => l.status === 'Converted').length
    const lost = leads.filter((l) => l.status === 'Lost').length

    // Division-by-zero protection for conversion rate
    const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0'

    // Overdue Follow-ups strict calculation
    const overdue = followUps.filter((f) => isFollowUpOverdue(f))

    // Sort overdue items by oldest due_at first (most urgent)
    const sortedOverdue = [...overdue]
      .sort((a, b) => new Date(a.due_at) - new Date(b.due_at))
      .slice(0, 5)

    // Recent enquiries (latest student enquiries by created_at)
    const sortedRecent = [...leads]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    // Status distribution segments for horizontal bar chart
    const statuses = [
      {
        label: 'New',
        count: newCount,
        color: 'var(--status-new-text)',
        bg: 'var(--status-new-bg)',
        barBg: '#3b82f6'
      },
      {
        label: 'Contacted',
        count: contacted,
        color: 'var(--status-contacted-text)',
        bg: 'var(--status-contacted-bg)',
        barBg: '#a855f7'
      },
      {
        label: 'Qualified',
        count: qualified,
        color: 'var(--status-qualified-text)',
        bg: 'var(--status-qualified-bg)',
        barBg: '#f59e0b'
      },
      {
        label: 'Converted',
        count: converted,
        color: 'var(--status-converted-text)',
        bg: 'var(--status-converted-bg)',
        barBg: '#10b981'
      },
      {
        label: 'Lost',
        count: lost,
        color: 'var(--status-lost-text)',
        bg: 'var(--status-lost-bg)',
        barBg: '#f43f5e'
      }
    ].map((s) => ({
      ...s,
      pct: total > 0 ? ((s.count / total) * 100).toFixed(1) : '0'
    }))

    // Source breakdown with conversion per channel
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

    const sources = Object.values(sourceMap)
      .sort((a, b) => b.total - a.total)
      .map((s) => ({
        ...s,
        pct: total > 0 ? Math.round((s.total / total) * 100) : 0,
        convRate: s.total > 0 ? ((s.converted / s.total) * 100).toFixed(0) : '0'
      }))

    return {
      totalLeads: total,
      newLeadsCount: newCount,
      convertedLeadsCount: converted,
      overdueFollowUpsCount: overdue.length,
      conversionRate: rate,
      statusSegments: statuses,
      sourceBreakdown: sources,
      urgentOverdueList: sortedOverdue,
      recentEnquiriesList: sortedRecent
    }
  }, [leads, followUps])

  // Scope label based on user role
  const roleScopeLabel = useMemo(() => {
    if (userRole === 'admin') return 'Institute Overview • Administrator'
    if (userRole === 'manager') return 'Team Overview • Manager'
    return 'My Assigned Pipeline • Counsellor'
  }, [userRole])

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

  return (
    <div className="dashboard-container">
      {/* Top Header with Role Scope and Actions */}
      <div className="page-header">
        <div className="page-header-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1>Executive Dashboard</h1>
            <span className="dashboard-scope-pill" title="Row Level Security Data Scope">
              <Layers size={13} />
              <span>{roleScopeLabel}</span>
            </span>
          </div>
          <p>Real-time coaching admissions pipeline, student conversions, and urgent counsellor tasks.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Refresh dashboard metrics"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
            <span className="desktop-only-text">Refresh Data</span>
          </button>

          <Link to="/leads" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>View Leads Pipeline</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="auth-alert-box error" style={{ marginBottom: '20px' }} role="alert">
          <AlertTriangle size={18} className="auth-alert-icon" />
          <div className="auth-alert-text">
            <strong>Unable to load dashboard data:</strong> {error}
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

      {/* 5 KPI Metric Cards */}
      <div className="metrics-grid">
        {/* KPI 1: Total Leads */}
        <Link to="/leads" className="metric-card metric-card-interactive" title="View all leads">
          <div className="metric-header">
            <span className="metric-label">Total Leads</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">
            {isLoading ? <span className="skeleton-pulse" style={{ display: 'inline-block', width: '60px', height: '32px', borderRadius: '4px' }} /> : totalLeads}
          </div>
          <div className="metric-footer-row">
            <span className="metric-subtext">Coaching pipeline volume</span>
            <ChevronRight size={14} className="metric-arrow" />
          </div>
        </Link>

        {/* KPI 2: New Enquiries */}
        <Link to="/leads?status=New" className="metric-card metric-card-interactive" title="Filter by New leads">
          <div className="metric-header">
            <span className="metric-label">New Enquiries</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="metric-value">
            {isLoading ? <span className="skeleton-pulse" style={{ display: 'inline-block', width: '60px', height: '32px', borderRadius: '4px' }} /> : newLeadsCount}
          </div>
          <div className="metric-footer-row">
            <span className="metric-subtext">Awaiting initial outreach</span>
            <ChevronRight size={14} className="metric-arrow" />
          </div>
        </Link>

        {/* KPI 3: Converted Students */}
        <Link to="/leads?status=Converted" className="metric-card metric-card-interactive" title="Filter by Converted leads">
          <div className="metric-header">
            <span className="metric-label">Converted Students</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="metric-value">
            {isLoading ? <span className="skeleton-pulse" style={{ display: 'inline-block', width: '60px', height: '32px', borderRadius: '4px' }} /> : convertedLeadsCount}
          </div>
          <div className="metric-footer-row">
            <span className="metric-subtext">Successfully enrolled</span>
            <ChevronRight size={14} className="metric-arrow" />
          </div>
        </Link>

        {/* KPI 4: Overdue Follow-ups */}
        <Link to="/follow-ups" className="metric-card metric-card-interactive" title="View overdue callbacks">
          <div className="metric-header">
            <span className="metric-label">Overdue Callbacks</span>
            <div
              className="metric-icon-box"
              style={{
                backgroundColor: overdueFollowUpsCount > 0 ? '#fef2f2' : '#f8fafc',
                color: overdueFollowUpsCount > 0 ? '#dc2626' : 'var(--text-muted)'
              }}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={`metric-value ${overdueFollowUpsCount > 0 ? 'text-danger' : ''}`}>
            {isLoading ? <span className="skeleton-pulse" style={{ display: 'inline-block', width: '60px', height: '32px', borderRadius: '4px' }} /> : overdueFollowUpsCount}
          </div>
          <div className="metric-footer-row">
            <span className="metric-subtext">
              {overdueFollowUpsCount > 0 ? 'Requires immediate action' : 'All follow-ups on track'}
            </span>
            <ChevronRight size={14} className="metric-arrow" />
          </div>
        </Link>

        {/* KPI 5: Conversion Rate */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Conversion Rate</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-value">
            {isLoading ? <span className="skeleton-pulse" style={{ display: 'inline-block', width: '80px', height: '32px', borderRadius: '4px' }} /> : `${conversionRate}%`}
          </div>
          <div className="metric-footer-row">
            <span className="metric-subtext">
              {totalLeads > 0 ? `${convertedLeadsCount} of ${totalLeads} enquiries` : 'No lead records yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Pipeline Distribution & Sources */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Pipeline Stage Distribution */}
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div>
              <h2 className="dashboard-chart-title">Pipeline Stage Distribution</h2>
              <p className="dashboard-chart-subtitle">Progression of student leads through admission stages</p>
            </div>
            <Link to="/leads" className="dashboard-link-btn">
              <span>Explore Pipeline</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="chart-skeleton-box skeleton-pulse" />
          ) : totalLeads === 0 ? (
            <div className="dashboard-empty-chart">
              <Compass size={28} color="var(--text-subtle)" />
              <p>No leads recorded yet. Create your first lead to see pipeline distribution.</p>
            </div>
          ) : (
            <div>
              {/* Proportional Segmented Progress Bar */}
              <div className="pipeline-segment-bar" role="progressbar" aria-label="Lead status distribution">
                {statusSegments.map((seg) => (
                  parseFloat(seg.pct) > 0 && (
                    <div
                      key={seg.label}
                      className="pipeline-segment-fill"
                      style={{
                        width: `${seg.pct}%`,
                        backgroundColor: seg.barBg
                      }}
                      title={`${seg.label}: ${seg.count} leads (${seg.pct}%)`}
                    />
                  )
                ))}
              </div>

              {/* Status Legend & Breakdown Cards */}
              <div className="pipeline-legend-grid">
                {statusSegments.map((seg) => (
                  <div key={seg.label} className="pipeline-legend-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="legend-color-dot" style={{ backgroundColor: seg.barBg }} />
                      <span className="legend-label">{seg.label}</span>
                    </div>
                    <div className="legend-values">
                      <span className="legend-count">{seg.count}</span>
                      <span className="legend-pct">({seg.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Lead Acquisition Sources */}
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div>
              <h2 className="dashboard-chart-title">Enquiry Sources & Conversion</h2>
              <p className="dashboard-chart-subtitle">Channel volume and enrolled student conversion effectiveness</p>
            </div>
            <span className="sources-count-badge">
              {sourceBreakdown.length} {sourceBreakdown.length === 1 ? 'channel' : 'channels'}
            </span>
          </div>

          {isLoading ? (
            <div className="chart-skeleton-box skeleton-pulse" />
          ) : sourceBreakdown.length === 0 ? (
            <div className="dashboard-empty-chart">
              <Tag size={28} color="var(--text-subtle)" />
              <p>No enquiry source data recorded yet.</p>
            </div>
          ) : (
            <div className="sources-breakdown-list">
              {sourceBreakdown.map((src) => (
                <div key={src.source} className="source-row">
                  <div className="source-info">
                    <span className="source-name font-semibold">{src.source}</span>
                    <div className="source-meta">
                      <span>{src.total} leads ({src.pct}%)</span>
                      <span className="source-conv-tag">
                        {src.convRate}% converted ({src.converted})
                      </span>
                    </div>
                  </div>
                  <div className="source-bar-wrapper">
                    <div
                      className="source-bar-fill"
                      style={{ width: `${Math.max(src.pct, 4)}%` }}
                      title={`${src.source}: ${src.total} leads (${src.pct}%)`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Urgent Action Lists: Overdue Callbacks & Recent Enquiries */}
      <div className="dashboard-actions-grid">
        {/* Urgent List 1: Overdue Callbacks */}
        <div className="card dashboard-list-card">
          <div className="dashboard-list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="urgent-icon-pill">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h3 className="dashboard-list-title">Urgent Overdue Follow-ups</h3>
                <span className="dashboard-list-sub">Callbacks past scheduled appointment</span>
              </div>
            </div>
            <Link to="/follow-ups" className="dashboard-link-btn">
              <span>View All ({overdueFollowUpsCount})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="dashboard-list-body">
            {isLoading ? (
              <div className="dashboard-skeleton-items">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="list-skeleton-row skeleton-pulse" />
                ))}
              </div>
            ) : urgentOverdueList.length === 0 ? (
              <div className="dashboard-list-empty success-empty">
                <CheckCircle2 size={28} color="var(--alert-success-text)" />
                <p className="empty-title">All Follow-ups on Track!</p>
                <p className="empty-desc">No overdue student callbacks right now. Check upcoming tasks in the follow-ups center.</p>
                <Link to="/follow-ups" className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '12.5px' }}>
                  View Scheduled Follow-ups
                </Link>
              </div>
            ) : (
              <div className="urgent-items-list">
                {urgentOverdueList.map((item) => {
                  const timing = formatFollowUpTiming(item.due_at, item.status)
                  const studentName = item.lead?.full_name || 'Student Enquiry'
                  const studentPhone = item.lead?.phone

                  return (
                    <div key={item.id} className="urgent-item-row">
                      <div className="urgent-item-main">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link to={`/leads/${item.lead_id}`} className="urgent-student-name">
                            {studentName}
                          </Link>
                          {studentPhone && (
                            <a href={`tel:${studentPhone}`} className="urgent-call-btn" title={`Call ${studentPhone}`}>
                              <Phone size={12} />
                              <span>{studentPhone}</span>
                            </a>
                          )}
                        </div>
                        <p className="urgent-item-note">"{item.note}"</p>
                      </div>

                      <div className="urgent-item-side">
                        <span className="badge badge-overdue" title={new Date(item.due_at).toLocaleString('en-IN')}>
                          {timing.label}
                        </span>
                        <Link to={`/leads/${item.lead_id}`} className="urgent-action-link" title="Open student lead">
                          <span>Action</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Urgent List 2: Recent Student Enquiries */}
        <div className="card dashboard-list-card">
          <div className="dashboard-list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="enquiry-icon-pill">
                <Clock size={15} />
              </div>
              <div>
                <h3 className="dashboard-list-title">Recent Student Enquiries</h3>
                <span className="dashboard-list-sub">Latest leads registered in the system</span>
              </div>
            </div>
            <Link to="/leads" className="dashboard-link-btn">
              <span>View Pipeline</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="dashboard-list-body">
            {isLoading ? (
              <div className="dashboard-skeleton-items">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="list-skeleton-row skeleton-pulse" />
                ))}
              </div>
            ) : recentEnquiriesList.length === 0 ? (
              <div className="dashboard-list-empty">
                <Compass size={28} color="var(--text-subtle)" />
                <p className="empty-title">No Enquiries Yet</p>
                <p className="empty-desc">New enquiries received via walk-ins, phone, or website will appear here in real time.</p>
                <Link to="/leads" className="btn btn-primary" style={{ marginTop: '10px', fontSize: '12.5px' }}>
                  Capture First Lead
                </Link>
              </div>
            ) : (
              <div className="recent-enquiries-list">
                {recentEnquiriesList.map((lead) => (
                  <div key={lead.id} className="recent-enquiry-row">
                    <div className="recent-enquiry-main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Link to={`/leads/${lead.id}`} className="recent-student-name">
                          {lead.full_name}
                        </Link>
                        <span className="recent-course-badge">
                          {lead.course_interest}
                        </span>
                      </div>
                      <div className="recent-enquiry-meta">
                        <span>Source: {lead.source}</span>
                        <span>•</span>
                        <span>{formatActivityTime(lead.created_at)}</span>
                      </div>
                    </div>

                    <div className="recent-enquiry-side">
                      <span className={`badge ${getBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                      <Link to={`/leads/${lead.id}`} className="recent-action-link" title="View student details">
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
