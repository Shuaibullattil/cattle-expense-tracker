import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { fetchAnimals } from '../api/animals'
import { fetchExpenseAllocations, fetchExpenses } from '../api/expenses'
import { fetchIncome } from '../api/income'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency, categoryLabel, capitalizeSpecies } from '../utils/format'
import {
  lastNMonths,
  getMonthLabel,
  sumByMonth,
  groupByCategory,
  groupExpensesBySpecies,
  calcAnimalFinancials,
} from '../utils/aggregations'

const PIE_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#15803d', '#14532d']

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [animals, setAnimals] = useState([])
  const [expenses, setExpenses] = useState([])
  const [allocations, setAllocations] = useState([])
  const [income, setIncome] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [aRes, eRes, allocRes, iRes] = await Promise.all([
        fetchAnimals(),
        fetchExpenses(),
        fetchExpenseAllocations(),
        fetchIncome(),
      ])
      if (aRes.error || eRes.error || allocRes.error || iRes.error) {
        setError(aRes.error || eRes.error || allocRes.error || iRes.error)
      } else {
        setAnimals(aRes.data)
        setExpenses(eRes.data)
        setAllocations(allocRes.data)
        setIncome(iRes.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert-error">{error}</div>

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalIncome = income.reduce((s, i) => s + Number(i.amount || 0), 0)
  const netAllTime = totalIncome - totalExpenses

  const months = lastNMonths(12)
  const expenseByMonth = sumByMonth(expenses)
  const incomeByMonth = sumByMonth(income)
  const monthlyChart = months.map((m) => ({
    month: getMonthLabel(m),
    expenses: expenseByMonth[m] || 0,
    income: incomeByMonth[m] || 0,
  }))

  const categoryGroups = groupByCategory(expenses)
  const categoryTotal = Object.values(categoryGroups).reduce((s, v) => s + v, 0)
  const categoryTable = Object.entries(categoryGroups)
    .map(([cat, amt]) => ({
      category: categoryLabel(cat),
      amount: amt,
      percent: categoryTotal ? ((amt / categoryTotal) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.amount - a.amount)

  const pieData = categoryTable.map((row) => ({
    name: row.category,
    value: row.amount,
  }))

  const speciesExpenseGroups = groupExpensesBySpecies(expenses, animals, allocations)
  const speciesBarData = Object.entries(speciesExpenseGroups).map(([sp, amt]) => ({
    species: capitalizeSpecies(sp),
    expenses: amt,
  }))

  const animalRows = animals.map((a) => {
    const fin = calcAnimalFinancials(a, expenses, income, allocations)
    return {
      id: a.id,
      name: a.name,
      species: a.species,
      purchaseCost: fin.purchaseCost,
      expenses: fin.animalExpenses,
      income: fin.animalIncome,
      salePrice: fin.salePrice,
      net: fin.net,
      isSold: a.is_sold,
    }
  })

  const speciesSummary = {}
  for (const a of animals) {
    const sp = a.species?.toLowerCase() || 'other'
    if (!speciesSummary[sp]) {
      speciesSummary[sp] = { count: 0, expenses: 0, income: 0 }
    }
    speciesSummary[sp].count += 1
    const fin = calcAnimalFinancials(a, expenses, income, allocations)
    speciesSummary[sp].expenses += fin.animalExpenses
    speciesSummary[sp].income += fin.animalIncome
  }

  for (const i of income) {
    if (i.species && !i.animal_id) {
      const sp = i.species.toLowerCase()
      if (!speciesSummary[sp]) speciesSummary[sp] = { count: 0, expenses: 0, income: 0 }
      speciesSummary[sp].income += Number(i.amount || 0)
    }
  }

  const speciesTable = Object.entries(speciesSummary)
    .map(([sp, data]) => ({
      species: capitalizeSpecies(sp),
      ...data,
      net: data.income - data.expenses,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div>
      <h2 className="page-title">Reports</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500">All-time Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">All-time Income</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">All-time Net</p>
          <p className={`text-2xl font-bold mt-1 ${netAllTime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netAllTime)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Animals Ever</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{animals.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Expenses vs Income (12 months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
              <Bar dataKey="income" fill="#16a34a" name="Income" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-sm">No expense data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4">Expenses by Species</h3>
        {speciesBarData.length === 0 ? (
          <p className="text-gray-500 text-sm">No expense data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={speciesBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="species" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="expenses" fill="#16a34a" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Expense Summary by Category</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Amount</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryTable.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-500">No data</td></tr>
                ) : (
                  categoryTable.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>{row.percent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Per-Animal Profit / Loss</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Purchase Cost</th>
                  <th>Expenses</th>
                  <th>Income</th>
                  <th>Sale Price</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {animalRows.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-500">No animals</td></tr>
                ) : (
                  animalRows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium">{row.name}{row.isSold ? ' (sold)' : ''}</td>
                      <td className="capitalize">{row.species}</td>
                      <td>{formatCurrency(row.purchaseCost)}</td>
                      <td>{formatCurrency(row.expenses)}</td>
                      <td>{formatCurrency(row.income)}</td>
                      <td>{row.isSold ? formatCurrency(row.salePrice) : '—'}</td>
                      <td className={row.net >= 0 ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        {formatCurrency(row.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Per-Species Summary</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Species</th>
                  <th>Count</th>
                  <th>Total Expenses</th>
                  <th>Total Income</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {speciesTable.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-gray-500">No data</td></tr>
                ) : (
                  speciesTable.map((row) => (
                    <tr key={row.species}>
                      <td>{row.species}</td>
                      <td>{row.count}</td>
                      <td>{formatCurrency(row.expenses)}</td>
                      <td>{formatCurrency(row.income)}</td>
                      <td className={row.net >= 0 ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        {formatCurrency(row.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
