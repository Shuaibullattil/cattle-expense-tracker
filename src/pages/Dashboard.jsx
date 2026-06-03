import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { fetchAnimals } from '../api/animals'
import { fetchExpenses } from '../api/expenses'
import { fetchIncome } from '../api/income'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency, formatDate, categoryLabel, incomeTypeLabel } from '../utils/format'
import { getScopeLabel } from '../utils/scope'
import { isCurrentMonth, lastNMonths, getMonthLabel, sumByMonth } from '../utils/aggregations'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [animals, setAnimals] = useState([])
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const [aRes, eRes, iRes] = await Promise.all([
        fetchAnimals({ activeOnly: true }),
        fetchExpenses(),
        fetchIncome(),
      ])
      if (aRes.error || eRes.error || iRes.error) {
        setError(aRes.error || eRes.error || iRes.error)
      } else {
        setAnimals(aRes.data)
        setExpenses(eRes.data)
        setIncome(iRes.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert-error">{error}</div>

  const animalsMap = Object.fromEntries(animals.map((a) => [a.id, a]))
  const speciesCount = {}
  for (const a of animals) {
    const s = a.species?.toLowerCase() || 'other'
    speciesCount[s] = (speciesCount[s] || 0) + 1
  }

  const monthExpenses = expenses.filter((e) => isCurrentMonth(e.date)).reduce((s, e) => s + Number(e.amount), 0)
  const monthIncome = income.filter((i) => isCurrentMonth(i.date)).reduce((s, i) => s + Number(i.amount), 0)
  const netMonth = monthIncome - monthExpenses

  const recentExpenses = expenses.slice(0, 5)
  const recentIncome = income.slice(0, 5)

  const months = lastNMonths(6)
  const expenseByMonth = sumByMonth(expenses)
  const incomeByMonth = sumByMonth(income)
  const chartData = months.map((m) => ({
    month: getMonthLabel(m),
    expenses: expenseByMonth[m] || 0,
    income: incomeByMonth[m] || 0,
  }))

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Animals</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{animals.length}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(speciesCount).map(([sp, count]) => (
              <span key={sp} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full capitalize">
                {sp}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Expenses This Month</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(monthExpenses)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Income This Month</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Net This Month</p>
          <p className={`text-3xl font-bold mt-1 ${netMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netMonth)}
          </p>
        </div>
      </div>

      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 6 Months — Expenses vs Income</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
            <Bar dataKey="income" fill="#16a34a" name="Income" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Expenses</h3>
            <Link to="/expenses" className="text-sm text-green-700 hover:underline">View all</Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentExpenses.map((e) => (
                <li key={e.id} className="py-3 flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(e.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(e.date)} · {categoryLabel(e.category)} · {getScopeLabel(e, animalsMap)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Income</h3>
            <Link to="/income" className="text-sm text-green-700 hover:underline">View all</Link>
          </div>
          {recentIncome.length === 0 ? (
            <p className="text-gray-500 text-sm">No income yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentIncome.map((i) => (
                <li key={i.id} className="py-3 flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-green-700">{formatCurrency(i.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(i.date)} · {incomeTypeLabel(i.type)} · {getScopeLabel(i, animalsMap)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
