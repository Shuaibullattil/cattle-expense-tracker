import { supabase } from '../supabaseClient'
import { getCurrentUserId } from './auth'

export async function fetchEvents() {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('events')
      .select('*, animal:animal_id(id, name, species, tag_number)')
      .eq('user_id', userId)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch events' }
  }
}

export async function fetchEventsForAnimal(animalId) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .eq('animal_id', animalId)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch events for animal' }
  }
}

export async function createEvent(event) {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, user_id: userId })
      .select('*, animal:animal_id(id, name, species, tag_number)')
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to create event' }
  }
}

export async function deleteEvent(id) {
  try {
    const userId = await getCurrentUserId()
    const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete event' }
  }
}
