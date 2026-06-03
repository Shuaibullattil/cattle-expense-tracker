import * as XLSX from 'xlsx'
import { formatDate, categoryLabel, incomeTypeLabel, acquisitionTypeLabel } from './format'
import { calcAnimalFinancials } from './aggregations'
import { getScopeLabel } from './scope'
import { buildIncomeAllocations } from './incomeSplit'

function filterAnimals(animals, scope, species, animalId) {
  if (scope === 'animal' && animalId) {
    return animals.filter((a) => a.id === animalId)
  }
  if (scope === 'species' && species) {
    const sp = species.toLowerCase()
    return animals.filter((a) => a.species?.toLowerCase() === sp)
  }
  return animals
}

function expenseAppliesToScope(expense, animalIds, species, scope) {
  if (scope === 'farm') return true
  if (expense.animal_id && animalIds.has(expense.animal_id)) return true
  if (scope === 'species' && expense.species?.toLowerCase() === species?.toLowerCase()) return true
  if (expense.is_common && scope === 'farm') return true
  if (expense.is_common && scope === 'species') return true
  return false
}

function incomeAppliesToScope(incomeRow, animalIds, species, scope) {
  if (scope === 'farm') return true
  if (incomeRow.animal_id && animalIds.has(incomeRow.animal_id)) return true
  if (scope === 'species' && incomeRow.species?.toLowerCase() === species?.toLowerCase()) return true
  if (incomeRow.is_common) return true
  return false
}

function buildExpenseExportRows(expenses, allocations, animals, animalIds, scope, species) {
  const animalsMap = Object.fromEntries(animals.map((a) => [a.id, a]))
  const rows = []

  for (const e of expenses) {
    if (!expenseAppliesToScope(e, animalIds, species, scope)) continue

    if (e.animal_id && animalIds.has(e.animal_id)) {
      rows.push({
        Date: formatDate(e.date),
        Category: categoryLabel(e.category),
        Scope: getScopeLabel(e, animalsMap),
        'Bill Amount': Number(e.amount),
        'Attributed Amount': Number(e.amount),
        Notes: e.notes || '',
      })
      continue
    }

    const allocs = (e.expense_allocations || allocations.filter((a) => a.expense_id === e.id))
    if (allocs.length > 0) {
      for (const a of allocs) {
        if (!animalIds.has(a.animal_id)) continue
        const animal = animalsMap[a.animal_id]
        rows.push({
          Date: formatDate(e.date),
          Category: categoryLabel(e.category),
          Scope: animal ? `${getScopeLabel(e, animalsMap)} → ${animal.name}` : getScopeLabel(e, animalsMap),
          'Bill Amount': Number(e.amount),
          'Attributed Amount': Number(a.amount),
          Notes: e.notes || '',
        })
      }
    } else if (scope === 'farm' || (scope === 'species' && e.species)) {
      rows.push({
        Date: formatDate(e.date),
        Category: categoryLabel(e.category),
        Scope: getScopeLabel(e, animalsMap),
        'Bill Amount': Number(e.amount),
        'Attributed Amount': Number(e.amount),
        Notes: e.notes || '',
      })
    }
  }

  return rows
}

function buildIncomeExportRows(income, animals, animalIds, scope, species) {
  const animalsMap = Object.fromEntries(animals.map((a) => [a.id, a]))
  return income
    .filter((i) => incomeAppliesToScope(i, animalIds, species, scope))
    .map((i) => ({
      Date: formatDate(i.date),
      Type: incomeTypeLabel(i.type),
      Scope: getScopeLabel(i, animalsMap),
      Amount: Number(i.amount),
      Quantity: i.quantity ?? '',
      Unit: i.unit || '',
      Notes: i.notes || '',
    }))
}

export function exportReportToExcel({
  scope,
  species = '',
  animalId = '',
  animals,
  expenses,
  income,
  allocations,
  startDate = '',
  endDate = '',
}) {
  const filteredAnimals = filterAnimals(animals, scope, species, animalId)
  const animalIds = new Set(filteredAnimals.map((a) => a.id))
  const incomeAllocations = buildIncomeAllocations(income, animals)

  let filteredExpenses = expenses
  let filteredIncome = income

  if (startDate) {
    filteredExpenses = filteredExpenses.filter((e) => e.date >= startDate)
    filteredIncome = filteredIncome.filter((i) => i.date >= startDate)
  }
  if (endDate) {
    filteredExpenses = filteredExpenses.filter((e) => e.date <= endDate)
    filteredIncome = filteredIncome.filter((i) => i.date <= endDate)
  }

  const expenseRows = buildExpenseExportRows(
    filteredExpenses,
    allocations,
    animals,
    animalIds,
    scope,
    species,
  )
  const incomeRows = buildIncomeExportRows(filteredIncome, animals, animalIds, scope, species)

  let totalExpenses = expenseRows.reduce((s, r) => s + r['Attributed Amount'], 0)
  const totalIncome = incomeRows.reduce((s, r) => s + r.Amount, 0)

  if (scope === 'farm') {
    totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  }

  const summaryRows = [
    { Metric: 'Report scope', Value: scope === 'farm' ? 'Whole farm' : scope === 'species' ? `Species: ${species}` : `Animal: ${filteredAnimals[0]?.name || ''}` },
  ]

  if (startDate || endDate) {
    summaryRows.push({
      Metric: 'Date Range',
      Value: `${startDate ? formatDate(startDate) : 'Beginning'} to ${endDate ? formatDate(endDate) : 'Present'}`,
    })
  }

  summaryRows.push(
    { Metric: 'Total expenses (attributed)', Value: totalExpenses },
    { Metric: 'Total income', Value: totalIncome },
    { Metric: 'Net', Value: totalIncome - totalExpenses },
    { Metric: 'Animals in report', Value: filteredAnimals.length },
  )

  const animalSummaryRows = filteredAnimals.map((a) => {
    const fin = calcAnimalFinancials(a, filteredExpenses, filteredIncome, allocations, incomeAllocations, startDate, endDate)
    return {
      Name: a.name,
      Species: a.species,
      Status: a.is_sold ? 'Sold' : 'Active',
      'Purchase cost': fin.purchaseCost,
      Expenses: fin.animalExpenses,
      Income: fin.animalIncome,
      'Sale price': fin.salePrice,
      Net: fin.net,
      'Acquisition type': acquisitionTypeLabel(a.acquisition_type),
      'Acquired on': formatDate(a.acquisition_date),
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows.length ? expenseRows : [{ Note: 'No expenses' }]), 'Expenses')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeRows.length ? incomeRows : [{ Note: 'No income' }]), 'Income')
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(animalSummaryRows.length ? animalSummaryRows : [{ Note: 'No animals' }]),
    'Animals',
  )

  const slug =
    scope === 'farm'
      ? 'whole-farm'
      : scope === 'species'
        ? species.toLowerCase().replace(/\s+/g, '-')
        : filteredAnimals[0]?.name?.replace(/\s+/g, '-').toLowerCase() || 'animal'

  const dateSuffix = startDate || endDate
    ? `-${startDate || 'all'}-to-${endDate || 'present'}`
    : `-${new Date().toISOString().slice(0, 10)}`

  XLSX.writeFile(wb, `farm-report-${slug}${dateSuffix}.xlsx`)
}
