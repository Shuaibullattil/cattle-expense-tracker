import { supabase } from '../supabaseClient'

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data?.session?.user?.id
  if (!userId) {
    throw new Error('User not authenticated')
  }
  return userId
}
