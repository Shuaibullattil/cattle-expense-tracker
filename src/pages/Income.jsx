import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnimals } from '../api/animals'
import { deleteIncome, fetchIncome } from '../api/income'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import StyledSelect from '../components/StyledSelect'
import { FILTER_SCOPE_OPTIONS, incomeTypeFilterOptions } from '../constants/selectOptions'
import { formatCurrency, formatDate, incomeTypeLabel, todayISO } from '../utils/format'
import { getScopeLabel, getScopeType } from '../utils/scope'
import { filterByDateRange } from '../utils/aggregations'

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
      <div className="page-header">
        <h2 className="page-title mb-0">Income</h2>
        <Link to="/income/new" className="btn-primary w-full sm:w-auto">Add Income</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="card mb-4">
        <div className="filter-row">
          <div className="filter-field">
            <label className="form-label">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" />
          </div>
          <div className="filter-field">
            <label className="form-label">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" max={todayISO()} />
          </div>
          <div className="filter-field">
            <label className="form-label">Type</label>
            <StyledSelect value={typeFilter} onChange={setTypeFilter} options={incomeTypeFilterOptions()} />
          </div>
          <div className="filter-field">
            <label className="form-label">Scope</label>
            <StyledSelect value={scopeFilter} onChange={setScopeFilter} options={FILTER_SCOPE_OPTIONS} />
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-3 mb-4">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">No income found.</p>
        ) : (
          filtered.map((i) => (
            <div key={i.id} className="mobile-card">
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-green-700">{formatCurrency(i.amount)}</p>
                <p className="text-xs text-gray-500">{formatDate(i.date)}</p>
              </div>
              <p className="text-xs text-gray-600">{incomeTypeLabel(i.type)} · {getScopeLabel(i, animalsMap)}</p>
              {i.quantity && <p className="text-xs text-gray-500">{i.quantity} {i.unit || ''}</p>}
              <button type="button" onClick={() => setDeleteId(i.id)} className="btn-danger w-full text-xs !min-h-[40px] mt-1">
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
