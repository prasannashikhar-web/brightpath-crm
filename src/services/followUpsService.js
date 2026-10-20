import { supabase } from '../lib/supabaseClient.js'
import { logActivity, ACTIVITY_TYPES } from './activitiesService.js'

/**
 * Checks whether a follow-up is strictly overdue.
 * Rule: status must be 'pending' AND due_at must be before the current instant.
 * @param {object} followUp
 * @returns {boolean}
 */
export function isFollowUpOverdue(followUp) {
  if (!followUp || followUp.status !== 'pending' || !followUp.due_at) {
    return false
  }
  return new Date(followUp.due_at).getTime() < Date.now()
}

/**
 * Human-readable format for follow-up due dates.
 * Displays relative time ("Overdue by 2 hours", "Due Today at 4:30 PM", "Tomorrow at 10:00 AM")
 * @param {string} isoString
 * @param {string} status
 * @returns {{ label: string, isOverdue: boolean, isToday: boolean }}
 */
export function formatFollowUpTiming(isoString, status = 'pending') {
  if (!isoString) return { label: 'No date', isOverdue: false, isToday: false }

  try {
    const due = new Date(isoString)
    const now = new Date()
    const diffMs = due.getTime() - now.getTime()
    const isPast = diffMs < 0
    const isOverdue = status === 'pending' && isPast

    // Check if same calendar day
    const isToday = due.toDateString() === now.toDateString()

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = due.toDateString() === tomorrow.toDateString()

    const timeStr = due.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    if (isOverdue) {
      const overdueMs = Math.abs(diffMs)
      const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60))
      const overdueDays = Math.floor(overdueHours / 24)

      if (overdueHours < 1) {
        return { label: 'Overdue (just now)', isOverdue: true, isToday }
      }
      if (overdueHours < 24) {
        return { label: `Overdue by ${overdueHours}h`, isOverdue: true, isToday }
      }
      return { label: `Overdue by ${overdueDays}d`, isOverdue: true, isToday }
    }

    if (isToday) {
      return { label: `Today at ${timeStr}`, isOverdue: false, isToday: true }
    }
    if (isTomorrow) {
      return { label: `Tomorrow at ${timeStr}`, isOverdue: false, isToday: false }
    }

    const dateStr = due.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    })
    return { label: `${dateStr}, ${timeStr}`, isOverdue: false, isToday: false }
  } catch {
    return { label: isoString, isOverdue: false, isToday: false }
  }
}

/**
 * Fetches all follow-ups accessible by the authenticated user's RLS permissions,
 * joined with lead details and assignee profile.
 * @returns {Promise<Array<any>>}
 */
export async function fetchFollowUps() {
  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        id,
        lead_id,
        assigned_to,
        due_at,
        note,
        status,
        completed_at,
        created_by,
        created_at,
        lead:leads (
          id,
          full_name,
          phone,
          email,
          course_interest,
          status
        ),
        assignee:profiles!follow_ups_assigned_to_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!follow_ups_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .order('due_at', { ascending: true })

    if (error) {
      console.warn('[followUpsService] Explicit join fallback:', error.message)
      const fallback = await supabase
        .from('follow_ups')
        .select(`
          *,
          lead:leads (id, full_name, phone, email, course_interest, status)
        `)
        .order('due_at', { ascending: true })

      if (fallback.error) throw new Error(fallback.error.message)
      return fallback.data || []
    }

    return data || []
  } catch (err) {
    console.error('[followUpsService] fetchFollowUps failed:', err)
    throw err
  }
}

/**
 * Fetches follow-ups specifically for a single lead record.
 * @param {string} leadId
 * @returns {Promise<Array<any>>}
 */
export async function fetchFollowUpsByLead(leadId) {
  if (!leadId) return []

  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        id,
        lead_id,
        assigned_to,
        due_at,
        note,
        status,
        completed_at,
        created_by,
        created_at,
        assignee:profiles!follow_ups_assigned_to_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!follow_ups_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('lead_id', leadId)
      .order('due_at', { ascending: false })

    if (error) {
      console.warn('[followUpsService] fetchFollowUpsByLead fallback:', error.message)
      const fallback = await supabase
        .from('follow_ups')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_at', { ascending: false })

      if (fallback.error) throw new Error(fallback.error.message)
      return fallback.data || []
    }

    return data || []
  } catch (err) {
    console.error('[followUpsService] fetchFollowUpsByLead error:', err)
    throw err
  }
}

/**
 * Schedules a new follow-up interaction.
 * @param {object} params
 * @param {string} params.leadId - Target lead UUID
 * @param {string} params.dueAt - ISO string timestamp
 * @param {string} params.note - Planned follow-up objective
 * @param {string|null} [params.assignedTo] - Assignee profile UUID
 * @param {string} params.currentUserId - Creator user UUID
 * @returns {Promise<any>}
 */
export async function createFollowUp({
  leadId,
  dueAt,
  note,
  assignedTo = null,
  currentUserId
}) {
  if (!leadId) {
    throw new Error('Please select a student lead.')
  }
  if (!dueAt) {
    throw new Error('Please specify the follow-up date and time.')
  }
  if (!note || !note.trim()) {
    throw new Error('Follow-up objective or discussion note is required.')
  }
  if (note.trim().length < 3) {
    throw new Error('Note must be at least 3 characters.')
  }

  const payload = {
    lead_id: leadId,
    due_at: new Date(dueAt).toISOString(),
    note: note.trim(),
    status: 'pending',
    assigned_to: assignedTo && assignedTo !== 'unassigned' ? assignedTo : null,
    created_by: currentUserId || null
  }

  const { data, error } = await supabase
    .from('follow_ups')
    .insert([payload])
    .select(`
      id,
      lead_id,
      assigned_to,
      due_at,
      note,
      status,
      completed_at,
      created_by,
      created_at,
      lead:leads (
        id,
        full_name,
        phone,
        email,
        course_interest,
        status
      ),
      assignee:profiles!follow_ups_assigned_to_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .single()

  if (error) {
    console.error('[followUpsService] createFollowUp database error:', error)
    throw new Error(error.message || 'Failed to schedule follow-up.')
  }

  // Automatically record scheduled follow-up in audit trail
  try {
    const formattedDue = new Date(data.due_at).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    await logActivity({
      leadId: data.lead_id,
      actorId: currentUserId || null,
      activityType: ACTIVITY_TYPES.FOLLOWUP_CREATED,
      description: `Follow-up scheduled for ${formattedDue}`,
      metadata: {
        follow_up_id: data.id,
        due_at: data.due_at,
        note: data.note,
        assigned_to: data.assigned_to
      }
    })
  } catch (logErr) {
    console.error('[followUpsService] Failed to log followup_created activity:', logErr)
  }

  return data
}

/**
 * Marks a follow-up as completed with an optional outcome note.
 * @param {string} followUpId
 * @param {string} [outcomeNote]
 * @param {string|null} [currentUserId=null]
 * @returns {Promise<any>}
 */
export async function completeFollowUp(followUpId, outcomeNote = '', currentUserId = null) {
  if (!followUpId) {
    throw new Error('Follow-up ID is required.')
  }

  const updatePayload = {
    status: 'completed',
    completed_at: new Date().toISOString()
  }

  // If user provided an outcome note, append it to the existing note
  if (outcomeNote && outcomeNote.trim()) {
    const { data: existing } = await supabase
      .from('follow_ups')
      .select('note')
      .eq('id', followUpId)
      .single()

    if (existing?.note) {
      updatePayload.note = `${existing.note}\n\n[Outcome]: ${outcomeNote.trim()}`
    } else {
      updatePayload.note = outcomeNote.trim()
    }
  }

  const { data, error } = await supabase
    .from('follow_ups')
    .update(updatePayload)
    .eq('id', followUpId)
    .select(`
      id,
      lead_id,
      assigned_to,
      due_at,
      note,
      status,
      completed_at,
      created_by,
      created_at,
      lead:leads (
        id,
        full_name,
        phone,
        email,
        course_interest,
        status
      ),
      assignee:profiles!follow_ups_assigned_to_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .single()

  if (error) {
    console.error('[followUpsService] completeFollowUp error:', error)
    throw new Error(error.message || 'Failed to mark follow-up as complete.')
  }

  // Automatically record follow-up completion in audit trail
  try {
    const trimmedOutcome = outcomeNote?.trim()
    const description = trimmedOutcome
      ? `Follow-up completed with note: "${trimmedOutcome.length > 70 ? trimmedOutcome.slice(0, 70) + '...' : trimmedOutcome}"`
      : 'Follow-up interaction marked as completed'

    await logActivity({
      leadId: data.lead_id,
      actorId: currentUserId || null,
      activityType: ACTIVITY_TYPES.FOLLOWUP_COMPLETED,
      description,
      metadata: {
        follow_up_id: data.id,
        outcome_note: trimmedOutcome || null,
        completed_at: data.completed_at
      }
    })
  } catch (logErr) {
    console.error('[followUpsService] Failed to log followup_completed activity:', logErr)
  }

  return data
}

/**
 * Cancels a scheduled follow-up.
 * @param {string} followUpId
 * @returns {Promise<any>}
 */
export async function cancelFollowUp(followUpId) {
  if (!followUpId) {
    throw new Error('Follow-up ID is required.')
  }

  const { data, error } = await supabase
    .from('follow_ups')
    .update({ status: 'cancelled' })
    .eq('id', followUpId)
    .select()
    .single()

  if (error) {
    console.error('[followUpsService] cancelFollowUp error:', error)
    throw new Error(error.message || 'Failed to cancel follow-up.')
  }

  return data
}
