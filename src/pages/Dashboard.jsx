import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchAnimals } from '../api/animals'
import { fetchExpenses } from '../api/expenses'
import { fetchIncome } from '../api/income'
import { fetchMilkings } from '../api/milking'
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
  const [milkings, setMilkings] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const [aRes, eRes, iRes] = await Promise.all([
        fetchAnimals({ status: 'active' }),
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
      // fetch milkings for dashboard
      const mRes = await fetchMilkings()
      if (!mRes.error) setMilkings(mRes.data)
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
  const chartData = months.map((m) => ({
    month: getMonthLabel(m).split(' ')[0],
    expenses: expenseByMonth[m] || 0,
  }))

  // build last 7 days milking chart data
  const getLast7Days = () => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      days.push({ iso, label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`, quantity: 0 })
    }
    const map = Object.fromEntries(days.map((d) => [d.iso, d]))
    for (const m of milkings || []) {
      const key = (m.date || '').slice(0, 10)
      if (map[key]) map[key].quantity += Number(m.quantity || 0)
    }
    return Object.values(map)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="page-title mb-0">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-gray-500">Animals</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-800 mt-1">{animals.length}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(speciesCount).map(([sp, count]) => (
              <span key={sp} className="text-[10px] sm:text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full capitalize">
                {sp}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-gray-500">Expenses (month)</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{formatCurrency(monthExpenses)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-gray-500">Income (month)</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="stat-card col-span-2 lg:col-span-1">
          <p className="text-xs sm:text-sm text-gray-500">Net (month)</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${netMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netMonth)}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly expenses</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 10 }} width={48} stroke="#9ca3af" tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip formatter={(v) => formatCurrency(v)} labelStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} dot={{ r: 3, fill: '#dc2626' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Recent expenses</h3>
            <Link to="/expenses" className="text-xs text-green-700 font-medium">View all</Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-500 text-sm">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentExpenses.map((e) => (
                <li key={e.id} className="py-2.5 first:pt-0">
                  <p className="font-medium text-gray-900 text-sm">{formatCurrency(e.amount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(e.date)} · {categoryLabel(e.category)} · {getScopeLabel(e, animalsMap)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Recent income</h3>
            <Link to="/income" className="text-xs text-green-700 font-medium">View all</Link>
          </div>
          {recentIncome.length === 0 ? (
            <p className="text-gray-500 text-sm">No income yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentIncome.map((i) => (
                <li key={i.id} className="py-2.5 first:pt-0">
                  <p className="font-medium text-green-700 text-sm">{formatCurrency(i.amount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(i.date)} · {incomeTypeLabel(i.type)} · {getScopeLabel(i, animalsMap)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Weekly milking</h3>
            <Link to="/milking" className="text-xs text-green-700 font-medium">View all</Link>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={getLast7Days()} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} width={48} stroke="#9ca3af" />
              <Tooltip formatter={(v) => `${v} L`} labelStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="quantity" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
