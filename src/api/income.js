import { supabase } from '../supabaseClient'

export async function fetchIncome() {
  try {
    const { data, error } = await supabase
      .from('income')
      .select('*')
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
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('animal_id', animalId)
      .order('date', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch income' }
  }
}

export async function createIncome(entry) {
  try {
    const { data, error } = await supabase
      .from('income')
      .insert(entry)
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
    const { data, error } = await supabase
      .from('income')
      .update(updates)
      .eq('id', id)
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
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete income' }
  }
}
