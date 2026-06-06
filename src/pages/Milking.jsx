import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnimals } from '../api/animals'
import { fetchMilkings, deleteMilking } from '../api/milking'
import StyledSelect from '../components/StyledSelect'
import { animalSelectOptions } from '../constants/selectOptions'
import { filterByDateRange } from '../utils/aggregations'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate } from '../utils/format'

export default function Milking() {
  const [entries, setEntries] = useState([])
  const [animalsMap, setAnimalsMap] = useState({})
  const [animalFilter, setAnimalFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const reload = async () => {
    setLoading(true)
    const [mRes, aRes] = await Promise.all([fetchMilkings(), fetchAnimals()])
    if (mRes.error) setError(mRes.error)
    else setEntries(mRes.data)
    if (aRes.data) setAnimalsMap(Object.fromEntries(aRes.data.map((a) => [a.id, a])))
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [mRes, aRes] = await Promise.all([fetchMilkings(), fetchAnimals()])
      if (!active) return
      if (mRes.error) setError(mRes.error)
      else setEntries(mRes.data)
      if (aRes.data) setAnimalsMap(Object.fromEntries(aRes.data.map((a) => [a.id, a])))
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    const { error: err } = await deleteMilking(deleteId)
    setDeleteId(null)
    if (err) setError(err)
    else reload()
  }

  if (loading) return <LoadingSpinner />

  // Apply filters
  let filtered = filterByDateRange(entries, dateFrom, dateTo)
  if (animalFilter) filtered = filtered.filter((e) => e.animal_id === animalFilter)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title mb-0">Milking</h2>
        <Link to="/milking/new" className="btn-primary w-full sm:w-auto">Record Milking</Link>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Animal</label>
            <StyledSelect value={animalFilter} onChange={setAnimalFilter} options={[{ value: '', label: 'All animals' }, ...animalSelectOptions(Object.values(animalsMap))]} />
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" />
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-3 mb-4">
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">No milking records found.</p>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="mobile-card">
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-green-700">{e.quantity} L</p>
                <p className="text-xs text-gray-500">{formatDate(e.date)}</p>
              </div>
              <p className="text-xs text-gray-600">{animalsMap[e.animal_id]?.name || '—'}</p>
              <p className="text-xs text-gray-500">{e.notes || '—'}</p>
              <button type="button" onClick={() => setDeleteId(e.id)} className="btn-danger w-full text-xs min-h-10 mt-1">Delete</button>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Animal</th>
              <th>Quantity (L)</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No milking records found.</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{animalsMap[e.animal_id]?.name || '—'}</td>
                  <td className="font-medium text-green-700">{e.quantity}</td>
                  <td className="max-w-xs truncate">{e.notes || '—'}</td>
                  <td>
                    <button type="button" onClick={() => setDeleteId(e.id)} className="btn-danger text-xs py-1 px-2">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Milking"
        message="Are you sure you want to delete this milking record? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
