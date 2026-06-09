export function getMonthKey(dateStr) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

export function lastNMonths(n) {
  const result = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

export function sumByMonth(records, amountField = 'amount') {
  const totals = {}
  for (const r of records) {
    const key = getMonthKey(r.date)
    totals[key] = (totals[key] || 0) + Number(r[amountField] || 0)
  }
  return totals
}

export function isCurrentMonth(dateStr) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function filterByDateRange(records, from, to) {
  if (!from && !to) return records
  return records.filter((r) => {
    const d = r.date
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  })
}

export function groupByCategory(expenses) {
  const groups = {}
  for (const e of expenses) {
    groups[e.category] = (groups[e.category] || 0) + Number(e.amount || 0)
  }
  return groups
}

export function groupExpensesBySpecies(expenses, animals, allocations = []) {
  const animalSpecies = {}
  for (const a of animals) animalSpecies[a.id] = a.species?.toLowerCase()

  const groups = {}
  for (const e of expenses) {
    if (e.animal_id && animalSpecies[e.animal_id]) {
      const sp = animalSpecies[e.animal_id]
      groups[sp] = (groups[sp] || 0) + Number(e.amount || 0)
    }
  }
  for (const alloc of allocations) {
    const sp = animalSpecies[alloc.animal_id]
    if (sp) groups[sp] = (groups[sp] || 0) + Number(alloc.amount || 0)
  }
  return groups
}

export function calcAnimalFinancials(
  animal,
  expenses,
  incomeEntries,
  allocations = [],
  incomeAllocations = [],
  startDate = '',
  endDate = ''
) {
  // Direct expenses (where animal_id is set)
  const directExpenses = expenses
    .filter((e) => e.animal_id === animal.id)
    .reduce((s, e) => s + Number(e.amount || 0), 0)

  // Allocated expenses (from split expenses)
  const allocatedExpenses = allocations
    .filter((a) => {
      if (a.animal_id !== animal.id) return false
      
      // If we have date filters, verify if the parent expense is within the range
      if (startDate || endDate) {
        const parentExpense = expenses.find((e) => e.id === a.expense_id)
        if (parentExpense) {
          if (startDate && parentExpense.date < startDate) return false
          if (endDate && parentExpense.date > endDate) return false
        }
      }
      return true
    })
    .reduce((s, a) => s + Number(a.amount || 0), 0)
  
  const animalExpenses = directExpenses + allocatedExpenses

  // Direct income (where animal_id is set)
  const directIncome = incomeEntries
    .filter((i) => i.animal_id === animal.id)
    .reduce((s, i) => s + Number(i.amount || 0), 0)

  // Allocated income (from dynamic split income)
  const allocatedIncome = incomeAllocations
    .filter((a) => {
      if (a.animal_id !== animal.id) return false
      if (!a.isSplit) return false

      // If we have date filters, verify if the allocation date is within range
      if (startDate || endDate) {
        if (startDate && a.date < startDate) return false
        if (endDate && a.date > endDate) return false
      }
      return true
    })
    .reduce((s, a) => s + Number(a.amount || 0), 0)

  const animalIncome = directIncome + allocatedIncome

  const purchaseCost = (animal.acquisition_type === 'purchased' &&
    (!startDate || animal.acquisition_date >= startDate) &&
    (!endDate || animal.acquisition_date <= endDate))
    ? Number(animal.purchase_price || 0) : 0
  const salePrice = (animal.is_sold &&
    (!startDate || animal.sale_date >= startDate) &&
    (!endDate || animal.sale_date <= endDate))
    ? Number(animal.sale_price || 0) : 0
  const net = animalIncome + salePrice - animalExpenses - purchaseCost

  return { animalExpenses, animalIncome, purchaseCost, salePrice, net }
}
