import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Users,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  X,
  Copy,
  Check,
  CheckCircle2,
  FolderOpen
} from 'lucide-react'
import { fetchLeads, fetchTeamProfiles } from '../../services/leadsService'
import LeadFormModal from './LeadFormModal'
import LeadFilterBar from './LeadFilterBar'
import LeadCard from './LeadCard'
import TableSkeleton from '../../components/common/TableSkeleton'

// Relative time formatting helper
function formatRelativeTime(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function LeadsListPage() {
  const [leads, setLeads] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')

  // Modals & Feedback
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successBanner, setSuccessBanner] = useState('')
  const [copiedPhoneId, setCopiedPhoneId] = useState(null)

  // Data loading function
  const loadData = useCallback(async () => {
    try {
      const [leadsData, teamData] = await Promise.all([
        fetchLeads(),
        fetchTeamProfiles()
      ])
      setLeads(leadsData)
      setTeamMembers(teamData)
      setError(null)
    } catch (err) {
      console.error('[LeadsListPage] Data load error:', err)
      setError(err.message || 'Unable to connect to database. Please check your connection and retry.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleManualRefresh = useCallback(() => {
    setIsLoading(true)
    loadData()
  }, [loadData])

  useEffect(() => {
    let isMounted = true

    Promise.all([fetchLeads(), fetchTeamProfiles()])
      .then(([leadsData, teamData]) => {
        if (!isMounted) return
        setLeads(leadsData)
        setTeamMembers(teamData)
        setError(null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Unable to connect to database. Please check your connection and retry.')
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Handle phone copy action
  const handleCopyPhone = (id, phone) => {
    if (phone) {
      navigator.clipboard.writeText(phone)
      setCopiedPhoneId(id)
      setTimeout(() => setCopiedPhoneId(null), 1800)
    }
  }

  // Handle successful lead creation
  const handleLeadCreated = (newLead) => {
    setLeads((prev) => [newLead, ...prev])
    setSuccessBanner(`Lead for "${newLead.full_name}" has been recorded successfully.`)
    setTimeout(() => {
      setSuccessBanner('')
    }, 4500)
  }

  // Predefined and dynamically discovered lead sources
  const availableSources = useMemo(() => {
    const standard = [
      'Website Enquiry',
      'Walk-in / Campus Visit',
      'Google Search / Ad',
      'Meta / Instagram Ad',
      'Student / Parent Referral',
      'School Outreach Seminar',
      'Education Fair / Expo',
      'Direct Phone Call'
    ]
    const custom = leads.map((l) => l.source).filter(Boolean)
    return Array.from(new Set([...standard, ...custom]))
  }, [leads])

  // Status Tab Counts (Pipeline Volume across institute dataset)
  const statusCounts = useMemo(() => {
    const counts = { All: leads.length, New: 0, Contacted: 0, Qualified: 0, Converted: 0, Lost: 0 }
    for (const lead of leads) {
      if (counts[lead.status] !== undefined) {
        counts[lead.status] += 1
      }
    }
    return counts
  }, [leads])

  // Active filter checks
  const isFilterActive = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      statusFilter !== 'All' ||
      sourceFilter !== 'All' ||
      assigneeFilter !== 'All'
    )
  }, [searchQuery, statusFilter, sourceFilter, assigneeFilter])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim() !== '') count++
    if (statusFilter !== 'All') count++
    if (sourceFilter !== 'All') count++
    if (assigneeFilter !== 'All') count++
    return count
  }, [searchQuery, statusFilter, sourceFilter, assigneeFilter])

  // Reset Filters (Preserves user's chosen sort order)
  const handleResetFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('All')
    setSourceFilter('All')
    setAssigneeFilter('All')
  }, [])

  // Filter and Sort computation (AND logic across all 4 dimensions)
  const filteredAndSortedLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const rawDigits = q.replace(/\D/g, '')

    return leads
      .filter((lead) => {
        // 1. Status filter
        if (statusFilter !== 'All' && lead.status !== statusFilter) {
          return false
        }

        // 2. Source filter
        if (sourceFilter !== 'All' && lead.source !== sourceFilter) {
          return false
        }

        // 3. Assignee filter
        if (assigneeFilter !== 'All') {
          if (assigneeFilter === 'unassigned') {
            if (lead.assigned_to) return false
          } else if (lead.assigned_to !== assigneeFilter) {
            return false
          }
        }

        // 4. Omni-Search matching: Name, Phone, Email, Course
        if (q) {
          const matchName = lead.full_name?.toLowerCase().includes(q)
          const matchEmail = lead.email?.toLowerCase().includes(q)
          const matchCourse = lead.course_interest?.toLowerCase().includes(q)

          // Intelligent phone matching: matches formatted phone OR stripped digits
          const matchPhoneFormatted = lead.phone?.toLowerCase().includes(q)
          const phoneDigits = (lead.phone || '').replace(/\D/g, '')
          const matchPhoneDigits = rawDigits.length >= 3 && phoneDigits.includes(rawDigits)

          if (!matchName && !matchEmail && !matchCourse && !matchPhoneFormatted && !matchPhoneDigits) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at) - new Date(a.created_at)
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at) - new Date(b.created_at)
        }
        if (sortBy === 'name-asc') {
          return (a.full_name || '').localeCompare(b.full_name || '')
        }
        if (sortBy === 'name-desc') {
          return (b.full_name || '').localeCompare(a.full_name || '')
        }
        return 0
      })
  }, [leads, statusFilter, sourceFilter, assigneeFilter, searchQuery, sortBy])

  // Status badge style helper
  const getBadgeClass = (status) => {
    const map = {
      New: 'badge-new',
      Contacted: 'badge-contacted',
      Qualified: 'badge-qualified',
      Converted: 'badge-converted',
      Lost: 'badge-lost'
    }
    return map[status] || 'badge-new'
  }

  return (
    <div className="leads-page-container">
      {/* Top Header */}
      <div className="page-header">
        <div className="page-header-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Leads Pipeline</h1>
            <span className="pipeline-count-pill">
              {isFilterActive
                ? `Showing ${filteredAndSortedLeads.length} of ${leads.length}`
                : `${leads.length} Total`}
            </span>
          </div>
          <p>Real-time coaching admissions pipeline, student contacts, and counsellor follow-up tracking.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleManualRefresh}
            title="Refresh pipeline from Supabase"
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span className="desktop-only-text">Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="auth-alert-box success" style={{ marginBottom: '20px' }} role="status">
          <CheckCircle2 size={18} className="auth-alert-icon" />
          <div className="auth-alert-text">{successBanner}</div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            style={{ marginLeft: 'auto', color: 'var(--alert-success-text)' }}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Alert with Retry */}
      {error && (
        <div className="auth-alert-box error" style={{ marginBottom: '20px' }} role="alert">
          <AlertCircle size={18} className="auth-alert-icon" />
          <div className="auth-alert-text">
            <strong>Error loading leads:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search, Multi-Filter, and Sorting Controls */}
      <LeadFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusCounts={statusCounts}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        availableSources={availableSources}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        teamMembers={teamMembers}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
        isFilterActive={isFilterActive}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Content Area: Responsive Table (Desktop/Tablet) + Cards (Mobile) */}
      <div className="card pipeline-table-card">
        {/* Desktop / Tablet Table */}
        <div className="desktop-table-wrapper">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Student Profile</th>
                <th style={{ width: '22%' }}>Contact Details</th>
                <th style={{ width: '22%' }}>Academic Target</th>
                <th style={{ width: '16%' }}>Assignee</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rowCount={5} mode="table" />
              ) : filteredAndSortedLeads.length > 0 ? (
                filteredAndSortedLeads.map((lead) => {
                  const assignee = lead.assignee?.full_name
                  const isCopied = copiedPhoneId === lead.id

                  return (
                    <tr key={lead.id} className="pipeline-table-row">
                      {/* Student Profile */}
                      <td>
                        <div className="lead-cell-name">{lead.full_name}</div>
                        <div className="lead-cell-date">
                          Recorded {formatRelativeTime(lead.created_at)}
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="lead-cell-phone">{lead.phone}</span>
                          <button
                            type="button"
                            className="inline-copy-btn"
                            onClick={() => handleCopyPhone(lead.id, lead.phone)}
                            title="Copy phone"
                          >
                            {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {lead.email ? (
                          <div className="lead-cell-email">{lead.email}</div>
                        ) : (
                          <div className="lead-cell-email muted">No email provided</div>
                        )}
                      </td>

                      {/* Academic Target & Source */}
                      <td>
                        <div className="lead-cell-course">{lead.course_interest}</div>
                        <div className="lead-cell-source">Source: {lead.source}</div>
                      </td>

                      {/* Assignee */}
                      <td>
                        {assignee ? (
                          <span className="assignee-pill assigned" title={`Assigned to ${assignee}`}>
                            {assignee}
                          </span>
                        ) : (
                          <span className="assignee-pill unassigned">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${getBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/leads/${lead.id}`}
                          className="btn btn-secondary table-details-btn"
                          title="Open Lead Record"
                        >
                          <span>Details</span>
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="mobile-cards-wrapper">
          {isLoading ? (
            <TableSkeleton rowCount={4} mode="cards" />
          ) : filteredAndSortedLeads.length > 0 ? (
            filteredAndSortedLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : null}
        </div>

        {/* Empty States */}
        {!isLoading && leads.length === 0 && (
          <div className="pipeline-empty-state">
            <div className="empty-state-icon-box">
              <Users size={32} />
            </div>
            <h2 className="empty-state-title">No student enquiries yet</h2>
            <p className="empty-state-desc">
              Your admissions pipeline is currently clear. Capture your first walk-in, website, or phone inquiry to start follow-up tracking.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              <span>Capture First Lead</span>
            </button>
          </div>
        )}

        {!isLoading && leads.length > 0 && filteredAndSortedLeads.length === 0 && (
          <div className="pipeline-empty-state">
            <div className="empty-state-icon-box" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
              <FolderOpen size={30} color="var(--text-muted)" />
            </div>
            <h2 className="empty-state-title">No leads match your filter</h2>
            <p className="empty-state-desc">
              We couldn't find any student leads matching your current search query or status filter.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>

      {/* Create New Lead Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLeadCreated}
        teamMembers={teamMembers}
      />
    </div>
  )
}
