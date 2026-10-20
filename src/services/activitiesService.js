import { supabase } from '../lib/supabaseClient.js'

/**
 * Valid activity types for validation and display mapping.
 */
export const ACTIVITY_TYPES = {
  LEAD_CREATED: 'lead_created',
  STATUS_CHANGED: 'status_changed',
  LEAD_UPDATED: 'lead_updated',
  FOLLOWUP_CREATED: 'followup_created',
  FOLLOWUP_COMPLETED: 'followup_completed',
  NOTE_ADDED: 'note_added'
}

/**
 * Formats an ISO date-time into a clean humanized relative time string.
 * Examples: "Just now", "5m ago", "Today at 2:30 PM", "Yesterday at 11:00 AM", "14 Oct, 4:15 PM"
 * @param {string} isoString
 * @returns {string}
 */
export function formatActivityTime(isoString) {
  if (!isoString) return 'Unknown time'

  try {
    const activityDate = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - activityDate.getTime()

    // Guard future clock skew
    if (diffMs < 0) return 'Just now'

    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)

    if (diffSecs < 60) {
      return 'Just now'
    }

    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
    }

    const timeStr = activityDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    const isToday = activityDate.toDateString() === now.toDateString()
    if (isToday) {
      return `Today at ${timeStr}`
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = activityDate.toDateString() === yesterday.toDateString()
    if (isYesterday) {
      return `Yesterday at ${timeStr}`
    }

    const isSameYear = activityDate.getFullYear() === now.getFullYear()
    const dateStr = activityDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      ...(isSameYear ? {} : { year: 'numeric' })
    })

    return `${dateStr}, ${timeStr}`
  } catch {
    return isoString
  }
}

/**
 * Formats a full date-time string for precise tooltips and accessible labels.
 * @param {string} isoString
 * @returns {string}
 */
export function formatFullDateTime(isoString) {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  } catch {
    return isoString
  }
}

/**
 * Fetches all activity records for a specific lead ordered chronologically, newest first.
 * Joins the actor's profile to display name and role.
 * @param {string} leadId
 * @returns {Promise<Array<any>>}
 */
export async function fetchActivitiesByLead(leadId) {
  if (!leadId) {
    throw new Error('Lead ID is required to fetch activities.')
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at,
        actor:profiles!activities_actor_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[activitiesService] Fallback join for activities:', error.message)
      const fallback = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (fallback.error) {
        throw new Error(fallback.error.message)
      }
      return fallback.data || []
    }

    return data || []
  } catch (err) {
    console.error('[activitiesService] fetchActivitiesByLead error:', err)
    throw err
  }
}

/**
 * Records an activity entry for an audit trail in the activities table.
 * Resolves current authenticated user if actorId is not explicitly supplied.
 * Sanitizes metadata to ensure no sensitive tokens or passwords are leaked.
 * 
 * @param {object} params
 * @param {string} params.leadId - Target lead UUID
 * @param {string} [params.actorId] - User UUID performing the action
 * @param {string} params.activityType - Categorical activity key
 * @param {string} params.description - Human-readable summary of the action
 * @param {object} [params.metadata] - Non-sensitive structured context
 * @returns {Promise<any>}
 */
export async function logActivity({
  leadId,
  actorId,
  activityType,
  description,
  metadata = {}
}) {
  if (!leadId) {
    throw new Error('Cannot log activity: Missing lead reference ID.')
  }
  if (!activityType) {
    throw new Error('Cannot log activity: Activity type is required.')
  }
  if (!description || !description.trim()) {
    throw new Error('Cannot log activity: Description is required.')
  }

  try {
    let resolvedActorId = actorId
    if (!resolvedActorId) {
      const { data: { user } } = await supabase.auth.getUser()
      resolvedActorId = user?.id || null
    }

    // Ensure clean metadata without sensitive keys
    const cleanMetadata = { ...metadata }
    delete cleanMetadata.password
    delete cleanMetadata.token
    delete cleanMetadata.access_token

    const payload = {
      lead_id: leadId,
      actor_id: resolvedActorId,
      activity_type: activityType,
      description: description.trim(),
      metadata: cleanMetadata
    }

    const { data, error } = await supabase
      .from('activities')
      .insert([payload])
      .select(`
        id,
        lead_id,
        actor_id,
        activity_type,
        description,
        metadata,
        created_at,
        actor:profiles!activities_actor_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (error) {
      console.error('[activitiesService] logActivity database error:', error)
      throw new Error(error.message || 'Failed to record activity log.')
    }

    return data
  } catch (err) {
    console.error('[activitiesService] logActivity error:', err)
    throw err
  }
}
