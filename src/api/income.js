import { supabase } from '../supabaseClient'
import { getCurrentUserId } from './auth'

export async function fetchIncome() {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch income' }
  }
}

export async function fetchIncomeForAnimal(animalId) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('animal_id', animalId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch income' }
  }
}

export async function createIncome(entry) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('income')
      .insert({ ...entry, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to create income' }
  }
}

export async function updateIncome(id, updates) {
  try {
    const userId = await getCurrentUserId()
    const { user_id, ...safeUpdates } = updates
    const { data, error } = await supabase
      .from('income')
      .update(safeUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to update income' }
  }
}

export async function deleteIncome(id) {
  try {
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('income').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete income' }
  }
}
