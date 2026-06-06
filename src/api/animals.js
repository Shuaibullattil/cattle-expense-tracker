import { supabase } from '../supabaseClient'
import { getCurrentUserId } from './auth'

export async function fetchAnimals({ activeOnly = false, soldOnly = false, status, species = null } = {}) {
  try {
    const userId = await getCurrentUserId()
    let query = supabase.from('animals').select('*').order('name').eq('user_id', userId)
    const animalStatus = status ?? (activeOnly ? 'active' : soldOnly ? 'sold' : 'all')
    if (animalStatus === 'active') query = query.eq('is_sold', false)
    if (animalStatus === 'sold') query = query.eq('is_sold', true)
    if (species) query = query.ilike('species', species)
    const { data, error } = await query
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch animals' }
  }
}

export async function fetchAnimalById(id) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('animals')
      .select('*, mother:mother_id(id, name)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch animal' }
  }
}

export async function createAnimal(animal) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('animals')
      .insert({ ...animal, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to create animal' }
  }
}

export async function updateAnimal(id, updates) {
  try {
    const userId = await getCurrentUserId()
    const { user_id, ...safeUpdates } = updates
    const { data, error } = await supabase
      .from('animals')
      .update(safeUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to update animal' }
  }
}

export async function markAnimalSold(id, saleData) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('animals')
      .update({
        is_sold: true,
        sale_date: saleData.sale_date,
        sale_price: saleData.sale_price,
        sold_to: saleData.sold_to || null,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to mark animal as sold' }
  }
}

export async function deleteAnimal(id) {
  try {
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('animals').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete animal' }
  }
}

export async function fetchDistinctSpecies() {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('animals')
      .select('species')
      .eq('user_id', userId)
      .eq('is_sold', false)
    if (error) throw error
    const species = [...new Set((data || []).map((a) => a.species?.toLowerCase()).filter(Boolean))]
    return { data: species.sort(), error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch species' }
  }
}
