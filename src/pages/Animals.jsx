import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnimals } from '../api/animals'
import LoadingSpinner from '../components/LoadingSpinner'
import StyledSelect from '../components/StyledSelect'
import { ANIMAL_STATUS_OPTIONS, speciesSelectOptions } from '../constants/selectOptions'
import { formatDate, acquisitionTypeLabel } from '../utils/format'

export default function Animals() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [speciesFilter, setSpeciesFilter] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error: err } = await fetchAnimals({
        status: statusFilter === 'all' ? 'all' : statusFilter === 'sold' ? 'sold' : 'active',
      })
      if (!active) return
      if (err) setError(err)
      else setAnimals(data)
      setLoading(false)
    })()
    return () => { active = false }
  }, [statusFilter])

  const speciesOptions = [...new Set(animals.map((a) => a.species?.toLowerCase()).filter(Boolean))].sort()
  const filtered = speciesFilter
    ? animals.filter((a) => a.species?.toLowerCase() === speciesFilter)
    : animals

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert-error">{error}</div>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title mb-0">Animals</h2>
        <Link to="/animals/new" className="btn-primary w-full sm:w-auto">Add Animal</Link>
      </div>

      <div className="card mb-4">
        <div className="filter-row">
          <div className="filter-field">
            <label className="form-label">Status</label>
            <StyledSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={ANIMAL_STATUS_OPTIONS}
            />
          </div>
          <div className="filter-field">
            <label className="form-label">Species</label>
            <StyledSelect
              value={speciesFilter}
              onChange={setSpeciesFilter}
              options={speciesSelectOptions(speciesOptions)}
            />
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No animals found.</p>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="mobile-card">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {a.species}{a.tag_number ? ` · ${a.tag_number}` : ''}
                  </p>
                </div>
                {a.is_sold && (
                  <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                    Sold
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {acquisitionTypeLabel(a.acquisition_type)} · {formatDate(a.acquisition_date)}
              </p>
              <div className="flex gap-2 pt-2">
                <Link to={`/animals/${a.id}`} className="btn-secondary flex-1 text-xs !min-h-[40px]">View</Link>
                <Link to={`/animals/${a.id}/edit`} className="btn-secondary flex-1 text-xs !min-h-[40px]">Edit</Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tag</th>
              <th>Species</th>
              <th>Breed</th>
              <th>Acquired</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-8">No animals found.</td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td>{a.tag_number || '—'}</td>
                  <td className="capitalize">{a.species}</td>
                  <td>{a.breed || '—'}</td>
                  <td>{formatDate(a.acquisition_date)}</td>
                  <td>{acquisitionTypeLabel(a.acquisition_type)}</td>
                  <td>{a.is_sold ? 'Sold' : 'Active'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/animals/${a.id}`} className="btn-secondary text-xs !min-h-[36px] !py-1 !px-2">View</Link>
                      <Link to={`/animals/${a.id}/edit`} className="btn-secondary text-xs !min-h-[36px] !py-1 !px-2">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
