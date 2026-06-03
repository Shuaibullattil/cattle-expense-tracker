import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnimals } from '../api/animals'
import { deleteExpense, fetchExpenses } from '../api/expenses'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import StyledSelect from '../components/StyledSelect'
import { categoryFilterOptions, FILTER_SCOPE_OPTIONS } from '../constants/selectOptions'
import { formatCurrency, formatDate, categoryLabel, todayISO } from '../utils/format'
import { getScopeLabel, getScopeType } from '../utils/scope'

function expenseSplitSummary(expense) {
  const allocs = expense.expense_allocations || []
  if (allocs.length === 0) return null
  const perHead = allocs[0]?.amount
  return `Split: ${allocs.length} animals @ ${formatCurrency(perHead)} each`
}
import { filterByDateRange } from '../utils/aggregations'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [animalsMap, setAnimalsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const reload = async () => {
    setLoading(true)
    const [eRes, aRes] = await Promise.all([fetchExpenses(), fetchAnimals()])
    if (eRes.error) setError(eRes.error)
    else setExpenses(eRes.data)
    if (aRes.data) setAnimalsMap(Object.fromEntries(aRes.data.map((a) => [a.id, a])))
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [eRes, aRes] = await Promise.all([fetchExpenses(), fetchAnimals()])
      if (!active) return
      if (eRes.error) setError(eRes.error)
      else setExpenses(eRes.data)
      if (aRes.data) setAnimalsMap(Object.fromEntries(aRes.data.map((a) => [a.id, a])))
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    const { error: err } = await deleteExpense(deleteId)
    setDeleteId(null)
    if (err) setError(err)
    else reload()
  }

  let filtered = filterByDateRange(expenses, dateFrom, dateTo)
  if (categoryFilter) filtered = filtered.filter((e) => e.category === categoryFilter)
  if (scopeFilter) filtered = filtered.filter((e) => getScopeType(e) === scopeFilter)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title mb-0">Expenses</h2>
        <Link to="/expenses/new" className="btn-primary w-full sm:w-auto">Add Expense</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="card mb-4">
        <div className="filter-row">
          <div className="filter-field">
            <label className="form-label">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" max={dateTo || todayISO()} />
          </div>
          <div className="filter-field">
            <label className="form-label">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" min={dateFrom} max={todayISO()} />
          </div>
          <div className="filter-field">
            <label className="form-label">Category</label>
            <StyledSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryFilterOptions()} />
          </div>
          <div className="filter-field">
            <label className="form-label">Scope</label>
            <StyledSelect value={scopeFilter} onChange={setScopeFilter} options={FILTER_SCOPE_OPTIONS} />
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-3 mb-4">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">No expenses found.</p>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="mobile-card">
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-red-700">{formatCurrency(e.amount)}</p>
                <p className="text-xs text-gray-500">{formatDate(e.date)}</p>
              </div>
              <p className="text-xs text-gray-600">{categoryLabel(e.category)} · {getScopeLabel(e, animalsMap)}</p>
              {expenseSplitSummary(e) && <p className="text-xs text-green-700">{expenseSplitSummary(e)}</p>}
              {e.notes && <p className="text-xs text-gray-500 truncate">{e.notes}</p>}
              <button type="button" onClick={() => setDeleteId(e.id)} className="btn-danger w-full text-xs !min-h-[40px] mt-1">
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Scope</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No expenses found.</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{getScopeLabel(e, animalsMap)}</td>
                  <td>{categoryLabel(e.category)}</td>
                  <td className="font-medium text-red-700">{formatCurrency(e.amount)}</td>
                  <td className="max-w-xs">
                    {e.notes && <span className="block truncate">{e.notes}</span>}
                    {expenseSplitSummary(e) && (
                      <span className="block text-xs text-green-700 mt-0.5">{expenseSplitSummary(e)}</span>
                    )}
                    {!e.notes && !expenseSplitSummary(e) && '—'}
                  </td>
                  <td>
                    <button type="button" onClick={() => setDeleteId(e.id)} className="btn-danger text-xs py-1 px-2">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
