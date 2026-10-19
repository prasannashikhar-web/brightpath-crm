import { supabase } from '../lib/supabaseClient'

/**
 * Normalizes Supabase auth errors into clear, actionable messages.
 * @param {Error} error 
 * @returns {string}
 */
export function formatAuthError(error) {
  if (!error) return 'An unknown error occurred.'
  const msg = error.message || error.toString()

  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.'
  }
  if (msg.includes('User already registered')) {
    return 'An account with this email address already exists. Please sign in instead.'
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  if (msg.includes('rate limit')) {
    return 'Too many login attempts. Please wait a moment and try again.'
  }
  return msg
}

/**
 * Signs in a user with email and password.
 * @param {{ email: string, password: string }} credentials 
 * @returns {Promise<{ user: any, session: any, profile: any }>}
 */
export async function signIn({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  })

  if (error) {
    throw new Error(formatAuthError(error))
  }

  let profile = null
  if (data?.user) {
    profile = await fetchUserProfile(data.user.id)
  }

  return { user: data.user, session: data.session, profile }
}

/**
 * Registers a new user with full name, email, and password.
 * The PostgreSQL database trigger automatically provisions a public.profiles
 * record with role = 'counsellor'.
 * @param {{ email: string, password: string, fullName: string }} payload 
 * @returns {Promise<{ user: any, session: any, profile: any }>}
 */
export async function signUp({ email, password, fullName }) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = fullName.trim()

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName
      }
    }
  })

  if (error) {
    throw new Error(formatAuthError(error))
  }

  let profile = null
  if (data?.user) {
    profile = await fetchUserProfile(data.user.id)
  }

  return { user: data.user, session: data.session, profile }
}

/**
 * Signs out the currently authenticated user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(formatAuthError(error))
  }
}

/**
 * Fetches the user profile from the public.profiles table.
 * If the record hasn't been created yet by the trigger, retries briefly.
 * @param {string} userId 
 * @returns {Promise<any>}
 */
export async function fetchUserProfile(userId) {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[authService] Error fetching profile:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[authService] Unexpected profile fetch exception:', err)
    return null
  }
}

/**
 * Retrieves the current session from Supabase client.
 * @returns {Promise<{ session: any, user: any }>}
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.warn('[authService] Error getting current session:', error.message)
    return { session: null, user: null }
  }
  return { session, user: session?.user || null }
}
