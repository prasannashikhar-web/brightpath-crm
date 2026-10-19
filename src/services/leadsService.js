import { supabase } from '../lib/supabaseClient.js'

/**
 * Normalizes phone numbers for consistent display and search.
 * Supports standard 10-digit Indian numbers and international formats.
 * @param {string} rawPhone 
 * @returns {string}
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return ''
  const trimmed = rawPhone.trim()
  const cleaned = trimmed.replace(/[^\d+]/g, '')

  // 10-digit Indian mobile format (e.g. 9876543210 -> +91 98765 43210)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  // 12-digit with 91 prefix (e.g. 919876543210 -> +91 98765 43210)
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    const core = cleaned.slice(2)
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`
  }
  // If already starts with +91
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    const core = cleaned.slice(3)
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`
  }

  return trimmed
}

/**
 * Validates a lead form payload before submitting to Supabase.
 * @param {object} formData 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLeadForm(formData) {
  const errors = {}

  // Full Name: required, 2-100 characters
  const name = formData.full_name?.trim() || ''
  if (!name) {
    errors.full_name = 'Student full name is required.'
  } else if (name.length < 2) {
    errors.full_name = 'Name must be at least 2 characters.'
  } else if (name.length > 100) {
    errors.full_name = 'Name cannot exceed 100 characters.'
  }

  // Phone: required, valid digits
  const phone = formData.phone?.trim() || ''
  if (!phone) {
    errors.phone = 'Mobile number is required.'
  } else {
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      errors.phone = 'Please enter a valid phone number (8 to 15 digits).'
    }
  }

  // Email: optional, but if entered must match RFC format
  const email = formData.email?.trim() || ''
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address (e.g. student@example.com).'
    }
  }

  // Course Interest: required
  const course = formData.course_interest?.trim() || ''
  if (!course) {
    errors.course_interest = 'Please select or enter the target course.'
  }

  // Source: required
  const source = formData.source?.trim() || ''
  if (!source) {
    errors.source = 'Please select where this lead originated.'
  }

  // Notes: optional, max 1000 chars
  if (formData.notes && formData.notes.length > 1000) {
    errors.notes = 'Notes cannot exceed 1000 characters.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Fetches all leads permitted by Row Level Security for the authenticated user,
 * joined with assignee and creator profile information.
 * @returns {Promise<Array<any>>}
 */
export async function fetchLeads() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        full_name,
        email,
        phone,
        course_interest,
        source,
        status,
        lost_reason,
        notes,
        created_at,
        updated_at,
        assigned_to,
        created_by,
        assignee:profiles!leads_assigned_to_fkey (
          id,
          full_name,
          email,
          role
        ),
        creator:profiles!leads_created_by_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback query without foreign key alias if constraint name differs
      console.warn('[leadsService] Explicit join error, attempting simple relation:', error.message)
      const fallback = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (fallback.error) {
        throw new Error(fallback.error.message)
      }
      return fallback.data || []
    }

    return data || []
  } catch (err) {
    console.error('[leadsService] fetchLeads failed:', err)
    throw err
  }
}

/**
 * Creates a new lead in the database.
 * Normalizes phone number, binds created_by, and enforces role-based assignment.
 * @param {object} leadData 
 * @param {object} currentUser 
 * @param {string} userRole 
 * @returns {Promise<any>}
 */
export async function createLead(leadData, currentUser, userRole = 'counsellor') {
  if (!currentUser?.id) {
    throw new Error('You must be signed in to create a lead.')
  }

  // Validation check
  const { isValid, errors } = validateLeadForm(leadData)
  if (!isValid) {
    const firstErr = Object.values(errors)[0]
    throw new Error(firstErr)
  }

  // Determine assigned_to based on role rules:
  // - Counsellor: ALWAYS assigned to self
  // - Manager/Admin: can assign to selected staff UUID, or null for unassigned
  const finalAssignedTo = userRole === 'counsellor'
    ? currentUser.id
    : (leadData.assigned_to && leadData.assigned_to !== 'unassigned' ? leadData.assigned_to : null)

  const payload = {
    full_name: leadData.full_name.trim(),
    phone: normalizePhone(leadData.phone),
    email: leadData.email?.trim().toLowerCase() || null,
    course_interest: leadData.course_interest.trim(),
    source: leadData.source.trim(),
    status: 'New', // Always starts at 'New'
    assigned_to: finalAssignedTo,
    created_by: currentUser.id,
    notes: leadData.notes?.trim() || null
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([payload])
    .select(`
      id,
      full_name,
      email,
      phone,
      course_interest,
      source,
      status,
      notes,
      created_at,
      assigned_to,
      created_by,
      assignee:profiles!leads_assigned_to_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .single()

  if (error) {
    console.error('[leadsService] createLead database error:', error)
    throw new Error(error.message || 'Failed to save lead record in database.')
  }

  return data
}

/**
 * Fetches the list of active team member profiles for the Assignee selector.
 * Allowed for all authenticated users by RLS.
 * @returns {Promise<Array<{ id: string, full_name: string, role: string, email: string }>>}
 */
export async function fetchTeamProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .order('full_name', { ascending: true })

    if (error) {
      console.warn('[leadsService] fetchTeamProfiles error:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[leadsService] fetchTeamProfiles exception:', err)
    return []
  }
}

const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost']

/**
 * Fetches a single lead by its unique UUID, joined with assignee and creator profiles.
 * @param {string} id 
 * @returns {Promise<any>}
 */
export async function fetchLeadById(id) {
  if (!id) {
    throw new Error('Lead ID is required.')
  }

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    const err = new Error('Invalid lead reference ID format.')
    err.code = 'INVALID_ID'
    throw err
  }

  const { data, error } = await supabase
    .from('leads')
    .select(`
      id,
      full_name,
      email,
      phone,
      course_interest,
      source,
      status,
      lost_reason,
      notes,
      created_at,
      updated_at,
      assigned_to,
      created_by,
      assignee:profiles!leads_assigned_to_fkey (
        id,
        full_name,
        email,
        role
      ),
      creator:profiles!leads_created_by_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[leadsService] fetchLeadById database error:', error)
    throw new Error(error.message || 'Failed to retrieve lead details.')
  }

  if (!data) {
    const notFoundErr = new Error('Lead record not found or access denied.')
    notFoundErr.code = 'NOT_FOUND'
    throw notFoundErr
  }

  return data
}

/**
 * Updates a lead's status pipeline stage.
 * Enforces:
 * - If newStatus is 'Lost', lostReason must be non-empty.
 * - If moving away from 'Lost' (including reopening as 'Contacted'), lost_reason is cleared to null.
 * - Both status and lost_reason are persisted together in a single atomic database update.
 * @param {string} leadId
 * @param {'New'|'Contacted'|'Qualified'|'Converted'|'Lost'} newStatus
 * @param {string|null} [lostReason=null]
 * @returns {Promise<any>}
 */
export async function updateLeadStatus(leadId, newStatus, lostReason = null) {
  if (!leadId) {
    throw new Error('Lead ID is required.')
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  let finalLostReason = null
  if (newStatus === 'Lost') {
    if (!lostReason || !lostReason.trim()) {
      throw new Error('A valid reason is mandatory when marking a lead as Lost.')
    }
    finalLostReason = lostReason.trim()
  }

  const payload = {
    status: newStatus,
    lost_reason: finalLostReason,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', leadId)
    .select(`
      id,
      full_name,
      email,
      phone,
      course_interest,
      source,
      status,
      lost_reason,
      notes,
      created_at,
      updated_at,
      assigned_to,
      created_by,
      assignee:profiles!leads_assigned_to_fkey (
        id,
        full_name,
        email,
        role
      ),
      creator:profiles!leads_created_by_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .maybeSingle()

  if (error) {
    console.error('[leadsService] updateLeadStatus database error:', error)
    throw new Error(error.message || 'Database error occurred while updating lead status.')
  }

  if (!data) {
    throw new Error('Update affected zero rows. You may not have permission to modify this lead.')
  }

  return data
}

/**
 * Updates editable lead information (contact, academic interest, notes, and assignment).
 * Strictly prevents non-manager/admin roles from reassigning leads.
 * @param {string} leadId
 * @param {object} updateData
 * @param {string} userRole
 * @returns {Promise<any>}
 */
export async function updateLeadDetails(leadId, updateData, userRole = 'counsellor') {
  if (!leadId) {
    throw new Error('Lead ID is required.')
  }

  const { isValid, errors } = validateLeadForm(updateData)
  if (!isValid) {
    const firstErr = Object.values(errors)[0]
    throw new Error(firstErr)
  }

  const payload = {
    full_name: updateData.full_name.trim(),
    phone: normalizePhone(updateData.phone),
    email: updateData.email?.trim().toLowerCase() || null,
    course_interest: updateData.course_interest.trim(),
    source: updateData.source.trim(),
    notes: updateData.notes?.trim() || null,
    updated_at: new Date().toISOString()
  }

  // Only Admin and Manager are authorized to reassign leads
  if (userRole === 'admin' || userRole === 'manager') {
    if (updateData.assigned_to !== undefined) {
      payload.assigned_to = (updateData.assigned_to && updateData.assigned_to !== 'unassigned')
        ? updateData.assigned_to
        : null
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', leadId)
    .select(`
      id,
      full_name,
      email,
      phone,
      course_interest,
      source,
      status,
      lost_reason,
      notes,
      created_at,
      updated_at,
      assigned_to,
      created_by,
      assignee:profiles!leads_assigned_to_fkey (
        id,
        full_name,
        email,
        role
      ),
      creator:profiles!leads_created_by_fkey (
        id,
        full_name,
        email,
        role
      )
    `)
    .maybeSingle()

  if (error) {
    console.error('[leadsService] updateLeadDetails database error:', error)
    throw new Error(error.message || 'Failed to update lead details.')
  }

  if (!data) {
    throw new Error('Update affected zero rows. You may not have permission to update this lead.')
  }

  return data
}
