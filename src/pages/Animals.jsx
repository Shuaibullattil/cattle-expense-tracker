import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnimals } from '../api/animals'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, acquisitionTypeLabel, capitalizeSpecies } from '../utils/format'

export default function Animals() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await fetchAnimals({ activeOnly: true })
      if (err) setError(err)
      else setAnimals(data)
      setLoading(false)
    }
    load()
  }, [])

  const speciesOptions = [...new Set(animals.map((a) => a.species?.toLowerCase()).filter(Boolean))].sort()
  const filtered = speciesFilter
    ? animals.filter((a) => a.species?.toLowerCase() === speciesFilter)
    : animals

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert-error">{error}</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="page-title mb-0">Animals</h2>
        <Link to="/animals/new" className="btn-primary">Add Animal</Link>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filter by species:</label>
        <select
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
          className="form-input w-auto min-w-[160px]"
        >
          <option value="">All species</option>
          {speciesOptions.map((s) => (
            <option key={s} value={s}>{capitalizeSpecies(s)}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tag No</th>
              <th>Species</th>
              <th>Breed</th>
              <th>Acquired</th>
              <th>Acquisition Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">No animals found.</td>
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
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/animals/${a.id}`} className="btn-secondary text-xs py-1 px-2">View</Link>
                      <Link to={`/animals/${a.id}/edit`} className="btn-secondary text-xs py-1 px-2">Edit</Link>
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
