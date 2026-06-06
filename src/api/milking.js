import { supabase } from '../supabaseClient'
import { getCurrentUserId } from './auth'

export async function fetchMilkings() {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('milking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch milkings' }
  }
}

export async function fetchMilkingsForAnimal(animalId) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('milking')
      .select('*')
      .eq('animal_id', animalId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch milkings for animal' }
  }
}

export async function createMilking(entry) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('milking')
      .insert({ ...entry, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to create milking' }
  }
}

export async function updateMilking(id, updates) {
  try {
    const userId = await getCurrentUserId()
    const { user_id, ...safeUpdates } = updates
    const { data, error } = await supabase
      .from('milking')
      .update(safeUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to update milking' }
  }
}

export async function deleteMilking(id) {
  try {
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('milking').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete milking' }
  }
}
