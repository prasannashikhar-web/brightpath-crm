import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  User,
  Share2
} from 'lucide-react'

const STATUS_TABS = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost']

/**
 * Dedicated Lead Filter & Search Toolbar component.
 * Provides omni-search, status tabs with pipeline totals, source dropdown,
 * assignee dropdown, sort selector, and one-click reset.
 */
export default function LeadFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusCounts = {},
  sourceFilter,
  onSourceChange,
  availableSources = [],
  assigneeFilter,
  onAssigneeChange,
  teamMembers = [],
  sortBy,
  onSortChange,
  onResetFilters,
  isFilterActive = false,
  activeFilterCount = 0
}) {
  return (
    <div className="card pipeline-filter-card" role="search" aria-label="Lead search and filters">
      {/* Top Tier: Search Bar + Sort Selector */}
      <div className="pipeline-controls-grid">
        {/* Omni-Search Box */}
        <div className="pipeline-search-box">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by student name, phone, email, course..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pipeline-search-input"
            aria-label="Search leads by name, phone, email, or course"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="pipeline-sort-box">
          <SlidersHorizontal size={14} color="var(--text-muted)" aria-hidden="true" />
          <label htmlFor="pipeline-sort-select" className="sort-label">Sort:</label>
          <select
            id="pipeline-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pipeline-sort-select"
            aria-label="Sort leads by"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Student Name (A–Z)</option>
            <option value="name-desc">Student Name (Z–A)</option>
          </select>
        </div>
      </div>

      {/* Middle Tier: Status Filter Tabs (Pipeline Volume) */}
      <div className="pipeline-status-tabs" role="tablist" aria-label="Filter by lead status">
        {STATUS_TABS.map((status) => {
          const isActive = statusFilter === status
          const count = statusCounts[status] ?? 0

          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`status-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onStatusChange(status)}
            >
              <span>{status}</span>
              <span className="status-tab-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Bottom Tier: Secondary Multi-Filters (Source & Assignee) + Reset Action */}
      <div className="pipeline-secondary-filters">
        <div className="secondary-filters-group">
          {/* Source Dropdown */}
          <div className="filter-select-wrapper">
            <Share2 size={13} className="filter-select-icon" aria-hidden="true" />
            <select
              value={sourceFilter}
              onChange={(e) => onSourceChange(e.target.value)}
              className="secondary-filter-select"
              aria-label="Filter by lead source"
            >
              <option value="All">All Sources</option>
              {availableSources.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Assignee Dropdown */}
          <div className="filter-select-wrapper">
            <User size={13} className="filter-select-icon" aria-hidden="true" />
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="secondary-filter-select"
              aria-label="Filter by assigned counsellor"
            >
              <option value="All">All Counsellors</option>
              <option value="unassigned">Unassigned Leads</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Tag & Reset Button */}
        {isFilterActive && (
          <div className="active-filters-action-slot">
            <span className="active-filter-badge">
              {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
            </span>
            <button
              type="button"
              className="btn btn-secondary filter-reset-btn"
              onClick={onResetFilters}
              title="Reset all active search and filter constraints"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
