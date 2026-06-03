import { supabase } from '../supabaseClient'

const ALL_ROWS = '00000000-0000-0000-0000-000000000000'

async function deleteAllFrom(table) {
  const { error } = await supabase.from(table).delete().neq('id', ALL_ROWS)
  if (error) throw error
}

export async function deleteAllData() {
  try {
    const { error: allocError } = await supabase
      .from('expense_allocations')
      .delete()
      .neq('id', ALL_ROWS)
    if (allocError && !allocError.message.includes('does not exist')) {
      throw allocError
    }

    await deleteAllFrom('expenses')
    await deleteAllFrom('income')
    await deleteAllFrom('animals')

    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete all data' }
  }
}
