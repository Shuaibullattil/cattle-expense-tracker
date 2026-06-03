import { supabase } from '../supabaseClient'
import { fetchAnimals } from './animals'
import { splitAmount } from '../utils/expenseSplit'

async function getEligibleAnimalsForExpense(expense) {
  const { data, error } = await fetchAnimals({ activeOnly: true, species: expense.species || null })
  if (error) throw new Error(error)
  if (expense.is_common) return data || []
  if (expense.species) return data || []
  return []
}

async function createExpenseAllocations(expense, excludedAnimalIds = []) {
  const eligible = await getEligibleAnimalsForExpense(expense)
  const excluded = new Set(excludedAnimalIds)
  const included = eligible.filter((a) => !excluded.has(a.id))

  if (included.length === 0) {
    throw new Error('Select at least one animal to include in this expense split.')
  }

  const shares = splitAmount(expense.amount, included.length)
  const rows = included.map((animal, i) => ({
    expense_id: expense.id,
    animal_id: animal.id,
    amount: shares[i],
  }))

  const { error } = await supabase.from('expense_allocations').insert(rows)
  if (error) throw error
  return { includedCount: included.length, shares }
}

export async function fetchExpenseAllocations() {
  try {
    const { data, error } = await supabase
      .from('expense_allocations')
      .select('id, expense_id, animal_id, amount')
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch expense allocations' }
  }
}

export async function fetchExpenses() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_allocations(animal_id, amount)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch expenses' }
  }
}

export async function fetchExpensesForAnimal(animalId) {
  try {
    const [directRes, allocRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('animal_id', animalId)
        .order('date', { ascending: false }),
      supabase
        .from('expense_allocations')
        .select('id, amount, expense:expense_id(*)')
        .eq('animal_id', animalId),
    ])

    if (directRes.error) throw directRes.error
    if (allocRes.error) throw allocRes.error

    const direct = (directRes.data || []).map((e) => ({
      ...e,
      rowKey: e.id,
      isSplit: false,
      displayAmount: Number(e.amount),
    }))

    const allocated = (allocRes.data || [])
      .filter((row) => row.expense)
      .map((row) => ({
        ...row.expense,
        rowKey: `alloc-${row.id}`,
        isSplit: true,
        allocationId: row.id,
        displayAmount: Number(row.amount),
        totalExpenseAmount: Number(row.expense.amount),
        splitNote: row.expense.is_common
          ? 'Farm-wide split'
          : `Species split (${row.expense.species})`,
      }))

    const merged = [...direct, ...allocated].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) return dateCmp
      return (b.created_at || '').localeCompare(a.created_at || '')
    })

    return { data: merged, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to fetch expenses' }
  }
}

export async function createExpense(expense, { excludedAnimalIds = [] } = {}) {
  try {
    const needsSplit = !expense.animal_id && (expense.is_common || expense.species)

    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    if (error) throw error

    if (needsSplit) {
      try {
        await createExpenseAllocations(data, excludedAnimalIds)
      } catch (allocErr) {
        await supabase.from('expenses').delete().eq('id', data.id)
        throw allocErr
      }
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to create expense' }
  }
}

export async function updateExpense(id, updates) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Failed to update expense' }
  }
}

export async function deleteExpense(id) {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err.message || 'Failed to delete expense' }
  }
}
