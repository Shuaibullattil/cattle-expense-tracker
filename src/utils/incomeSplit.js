import { splitAmount } from './expenseSplit'

export function getEligibleAnimalsForIncome(income, animals) {
  const date = income.date
  return animals.filter((a) => {
    // Eligible if acquired on or before the income date
    const acquired = a.acquisition_date <= date
    // Eligible if not sold, or sold after the income date
    const notSoldYet = !a.is_sold || a.sale_date >= date

    if (!acquired || !notSoldYet) return false

    if (income.is_common) return true
    if (income.species && a.species?.toLowerCase() === income.species.toLowerCase()) return true
    if (income.animal_id === a.id) return true

    return false
  })
}

export function buildIncomeAllocations(incomeList, allAnimals) {
  const allocations = []
  for (const inc of incomeList) {
    if (inc.animal_id) {
      allocations.push({
        id: `alloc-${inc.id}`,
        income_id: inc.id,
        animal_id: inc.animal_id,
        amount: Number(inc.amount),
        date: inc.date,
        isSplit: false,
      })
      continue
    }

    const eligible = getEligibleAnimalsForIncome(inc, allAnimals)
    if (eligible.length === 0) continue

    const shares = splitAmount(inc.amount, eligible.length)
    eligible.forEach((animal, idx) => {
      allocations.push({
        id: `alloc-${inc.id}-${animal.id}`,
        income_id: inc.id,
        animal_id: animal.id,
        amount: shares[idx],
        date: inc.date,
        isSplit: true,
        splitNote: inc.is_common
          ? 'Farm-wide split'
          : `Species split (${inc.species})`,
        totalIncomeAmount: Number(inc.amount),
      })
    })
  }
  return allocations
}
