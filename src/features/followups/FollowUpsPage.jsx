import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  X,
  FolderOpen
} from 'lucide-react'
import {
  fetchFollowUps,
  completeFollowUp,
  isFollowUpOverdue
} from '../../services/followUpsService.js'
import { fetchLeads, fetchTeamProfiles } from '../../services/leadsService.js'
import { useAuth } from '../../context/useAuth.js'
import ScheduleFollowUpModal from './ScheduleFollowUpModal.jsx'
import FollowUpCard from './FollowUpCard.jsx'

export default function FollowUpsPage() {
  const { profile } = useAuth()
  const userRole = profile?.role || 'counsellor'

  const [followUps, setFollowUps] = useState([])
  const [availableLeads, setAvailableLeads] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // View state: 'overdue' | 'upcoming' | 'completed'
  const [activeTab, setActiveTab] = useState('overdue')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & In-flight state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [notification, setNotification] = useState(null)

  // Data Loading
  const loadData = useCallback(async () => {
    try {
      const [followUpsData, leadsData, teamData] = await Promise.all([
        fetchFollowUps(),
        fetchLeads(),
        fetchTeamProfiles()
      ])
      setFollowUps(followUpsData)
      setAvailableLeads(leadsData)
      setTeamMembers(teamData)
      setError(null)
    } catch (err) {
      console.error('[FollowUpsPage] loadData error:', err)
      setError(err.message || 'Failed to connect to database.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    Promise.all([fetchFollowUps(), fetchLeads(), fetchTeamProfiles()])
      .then(([followUpsData, leadsData, teamData]) => {
        if (!isMounted) return
        setFollowUps(followUpsData)
        setAvailableLeads(leadsData)
        setTeamMembers(teamData)
        setError(null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Failed to load follow-ups.')
        setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Partition follow-ups into Overdue, Upcoming, Completed
  const { overdueList, upcomingList, completedList } = useMemo(() => {
    const overdue = []
    const upcoming = []
    const completed = []

    for (const item of followUps) {
      if (item.status === 'completed') {
        completed.push(item)
      } else if (item.status === 'pending') {
        if (isFollowUpOverdue(item)) {
          overdue.push(item)
        } else {
          upcoming.push(item)
        }
      }
    }

    // Sort overdue: most severely overdue first
    overdue.sort((a, b) => new Date(a.due_at) - new Date(b.due_at))
    // Sort upcoming: soonest first
    upcoming.sort((a, b) => new Date(a.due_at) - new Date(b.due_at))
    // Sort completed: most recently completed first
    completed.sort((a, b) => new Date(b.completed_at || b.due_at) - new Date(a.completed_at || a.due_at))

    return { overdueList: overdue, upcomingList: upcoming, completedList: completed }
  }, [followUps])

  // Select current list based on active tab
  const currentTabList = useMemo(() => {
    let list = []
    if (activeTab === 'overdue') list = overdueList
    else if (activeTab === 'upcoming') list = upcomingList
    else if (activeTab === 'completed') list = completedList

    if (!searchQuery.trim()) return list

    const q = searchQuery.toLowerCase().trim()
    return list.filter((item) => {
      const nameMatch = item.lead?.full_name?.toLowerCase().includes(q)
      const phoneMatch = item.lead?.phone?.toLowerCase().includes(q)
      const courseMatch = item.lead?.course_interest?.toLowerCase().includes(q)
      const noteMatch = item.note?.toLowerCase().includes(q)
      const assigneeMatch = item.assignee?.full_name?.toLowerCase().includes(q)

      return nameMatch || phoneMatch || courseMatch || noteMatch || assigneeMatch
    })
  }, [activeTab, overdueList, upcomingList, completedList, searchQuery])

  // Mark Complete handler
  const handleComplete = async (followUpId, outcomeNote) => {
    setCompletingId(followUpId)
    try {
      const updated = await completeFollowUp(followUpId, outcomeNote)
      setFollowUps((prev) => prev.map((item) => (item.id === followUpId ? updated : item)))
      setNotification({
        type: 'success',
        message: 'Follow-up marked as completed.'
      })
    } catch (err) {
      console.error('[FollowUpsPage] handleComplete error:', err)
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update follow-up.'
      })
    } finally {
      setCompletingId(null)
    }
  }

  // Follow-up scheduled callback
  const handleFollowUpCreated = (newFollowUp) => {
    setFollowUps((prev) => [newFollowUp, ...prev])
    setNotification({
      type: 'success',
      message: 'Follow-up scheduled successfully.'
    })
    // Auto-switch to upcoming tab if not overdue
    if (!isFollowUpOverdue(newFollowUp)) {
      setActiveTab('upcoming')
    }
  }

  return (
    <div className="followups-page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-title-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Follow-Up Management Engine</h1>
            {overdueList.length > 0 && (
              <span className="badge badge-overdue" style={{ fontSize: '12px', padding: '3px 8px' }}>
                {overdueList.length} Overdue
              </span>
            )}
          </div>
          <p>Track urgent callbacks, scheduled counselling sessions, and student interactions.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsLoading(true)
              loadData()
            }}
            disabled={isLoading}
            title="Refresh follow-ups list"
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
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {notification && (
        <div
          className={`detail-feedback-banner ${notification.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          role="status"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            className="feedback-dismiss-btn"
            onClick={() => setNotification(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="auth-alert-box error" style={{ marginBottom: '20px' }} role="alert">
          <AlertTriangle size={18} className="auth-alert-icon" />
          <div className="auth-alert-text">
            <strong>Error loading follow-ups:</strong> {error}
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

      {/* Main Tabs Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Navigation Tabs Header */}
        <div className="followup-tabs-header">
          {/* Overdue Tab */}
          <button
            type="button"
            className={`followup-tab-btn ${activeTab === 'overdue' ? 'active tab-overdue' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            <AlertTriangle size={15} />
            <span>Overdue Follow-ups</span>
            <span className={`followup-tab-count ${overdueList.length > 0 ? 'count-alert' : ''}`}>
              {overdueList.length}
            </span>
          </button>

          {/* Upcoming Tab */}
          <button
            type="button"
            className={`followup-tab-btn ${activeTab === 'upcoming' ? 'active tab-upcoming' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Clock size={15} />
            <span>Upcoming / Today</span>
            <span className="followup-tab-count">{upcomingList.length}</span>
          </button>

          {/* Completed Tab */}
          <button
            type="button"
            className={`followup-tab-btn ${activeTab === 'completed' ? 'active tab-completed' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle2 size={15} />
            <span>Completed</span>
            <span className="followup-tab-count">{completedList.length}</span>
          </button>
        </div>

        {/* Search Toolbar inside card */}
        <div className="followup-toolbar">
          <div className="pipeline-search-box" style={{ maxWidth: '420px', height: '36px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by student, phone, or discussion note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pipeline-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Showing <strong>{currentTabList.length}</strong> {activeTab} interactions
          </div>
        </div>

        {/* Follow-up Cards List */}
        <div className="followup-list-container">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              <div className="skeleton-line" style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton-line" style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton-line" style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)' }} />
            </div>
          ) : currentTabList.length > 0 ? (
            <div className="followup-cards-grid">
              {currentTabList.map((item) => (
                <FollowUpCard
                  key={item.id}
                  followUp={item}
                  onComplete={handleComplete}
                  isCompleting={completingId === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="pipeline-empty-state">
              <div className="empty-state-icon-box">
                {activeTab === 'overdue' ? (
                  <CheckCircle2 size={30} color="var(--alert-success-text)" />
                ) : (
                  <FolderOpen size={30} color="var(--text-muted)" />
                )}
              </div>
              <h2 className="empty-state-title">
                {activeTab === 'overdue'
                  ? 'No overdue follow-ups! 🎉'
                  : activeTab === 'upcoming'
                    ? 'No upcoming follow-ups scheduled'
                    : 'No completed interactions recorded yet'}
              </h2>
              <p className="empty-state-desc">
                {activeTab === 'overdue'
                  ? 'Outstanding callbacks are clear. Keep maintaining swift response times for high student conversion.'
                  : activeTab === 'upcoming'
                    ? 'Schedule a reminder to stay proactive with student enquiries.'
                    : 'Completed phone calls, counselling sessions, and campus visits will appear here with timestamps.'}
              </p>
              {activeTab !== 'overdue' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsModalOpen(true)}
                  style={{ marginTop: '8px' }}
                >
                  <Plus size={15} />
                  <span>Schedule Follow-up</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleFollowUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleFollowUpCreated}
        availableLeads={availableLeads}
        teamMembers={teamMembers}
        currentUser={profile}
        userRole={userRole}
      />
    </div>
  )
}
