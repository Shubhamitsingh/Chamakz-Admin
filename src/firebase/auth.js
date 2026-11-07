import { isSupabaseConfigured, supabase } from '../lib/supabase'

export const loginAdmin = async (email, password) => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured for this admin panel.' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('id, status')
    .eq('id', data.user.id)
    .maybeSingle()
  if (adminError || !admin || admin.status !== 'active') {
    await supabase.auth.signOut()
    return { success: false, error: 'This account is not an active admin.' }
  }
  return { success: true, user: data.user }
}

export const logoutAdmin = async () => {
  if (!supabase) return { success: false, error: 'Supabase is not configured.' }
  const { error } = await supabase.auth.signOut()
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export const onAuthChange = (callback) => {
  if (!supabase) {
    callback(null)
    return () => {}
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
  return () => data.subscription.unsubscribe()
}

export const resetPassword = async (email) => {
  if (!supabase) return { success: false, error: 'Supabase is not configured.' }
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user || null
}
