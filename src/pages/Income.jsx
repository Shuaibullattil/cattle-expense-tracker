import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnimals } from '../api/animals'
import { deleteIncome, fetchIncome } from '../api/income'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency, formatDate, incomeTypeLabel, todayISO } from '../utils/format'
import { getScopeLabel, getScopeType } from '../utils/scope'
import { filterByDateRange } from '../utils/aggregations'

const INCOME_TYPES = ['milk_sale', 'manure', 'other']

export default function Income() {
  const [income, setIncome] = useState([])
  const [animalsMap, setAnimalsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const reload = async () => {
    setLoading(true)
    const [iRes, aRes] = await Promise.all([fetchIncome(), fetchAnimals()])
    if (iRes.error) setError(iRes.error)
    else setIncome(iRes.data)
    if (aRes.data) setAnimalsMap(Object.fromEntries(aRes.data.map((a) => [a.id, a])))
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [iRes, aRes] = await Promise.all([fetchIncome(), fetchAnimals()])
      if (!active) return
      if (iRes.error) setError(iRes.error)
      else setIncome(iRes.data)
      if (aRes.data) setAnimalsMap(Object.fromEntries(aRes.data.map((a) => [a.id, a])))
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    const { error: err } = await deleteIncome(deleteId)
    setDeleteId(null)
    if (err) setError(err)
    else reload()
  }

  let filtered = filterByDateRange(income, dateFrom, dateTo)
  if (typeFilter) filtered = filtered.filter((i) => i.type === typeFilter)
  if (scopeFilter) filtered = filtered.filter((i) => getScopeType(i) === scopeFilter)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="page-title mb-0">Income</h2>
        <Link to="/income/new" className="btn-primary">Add Income</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="card mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="form-label">From Date</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="form-label">To Date</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" max={todayISO()} />
        </div>
        <div>
          <label className="form-label">Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input">
            <option value="">All types</option>
            {INCOME_TYPES.map((t) => (
              <option key={t} value={t}>{incomeTypeLabel(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Scope</label>
          <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className="form-input">
            <option value="">All scopes</option>
            <option value="animal">Individual Animal</option>
            <option value="species">Species</option>
            <option value="common">Whole Farm</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Scope</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Quantity</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No income entries found.</td></tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id}>
                  <td>{formatDate(i.date)}</td>
                  <td>{getScopeLabel(i, animalsMap)}</td>
                  <td>{incomeTypeLabel(i.type)}</td>
                  <td className="font-medium text-green-700">{formatCurrency(i.amount)}</td>
                  <td>{i.quantity ? `${i.quantity} ${i.unit || ''}`.trim() : '—'}</td>
                  <td className="max-w-xs truncate">{i.notes || '—'}</td>
                  <td>
                    <button type="button" onClick={() => setDeleteId(i.id)} className="btn-danger text-xs py-1 px-2">
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
        title="Delete Income"
        message="Are you sure you want to delete this income entry? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
