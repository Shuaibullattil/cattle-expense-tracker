import { supabase } from '../supabaseClient'

export async function fetchAnimals({ activeOnly = false, soldOnly = false, status, species = null } = {}) {
  try {
    let query = supabase.from('animals').select('*').order('name')
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
    const { data, error } = await supabase
      .from('animals')
      .select('*, mother:mother_id(id, name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch animal' }
  }
}

export async function createAnimal(animal) {
  try {
    const { data, error } = await supabase
      .from('animals')
      .insert(animal)
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
    const { data, error } = await supabase
      .from('animals')
      .update(updates)
      .eq('id', id)
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
    const { data, error } = await supabase
      .from('animals')
      .update({
        is_sold: true,
        sale_date: saleData.sale_date,
        sale_price: saleData.sale_price,
        sold_to: saleData.sold_to || null,
      })
      .eq('id', id)
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
    const { error } = await supabase.from('animals').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete animal' }
  }
}

export async function fetchDistinctSpecies() {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('species')
      .eq('is_sold', false)
    if (error) throw error
    const species = [...new Set((data || []).map((a) => a.species?.toLowerCase()).filter(Boolean))]
    return { data: species.sort(), error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch species' }
  }
}
