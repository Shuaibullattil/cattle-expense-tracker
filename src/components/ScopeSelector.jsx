import { useEffect, useState } from 'react'
import { fetchAnimals, fetchDistinctSpecies } from '../api/animals'

export default function ScopeSelector({ scopeType, setScopeType, animalId, setAnimalId, species, setSpecies, errors = {} }) {
  const [animals, setAnimals] = useState([])
  const [speciesList, setSpeciesList] = useState([])
  const [animalSearch, setAnimalSearch] = useState('')

  useEffect(() => {
    async function load() {
      const [animalsRes, speciesRes] = await Promise.all([
        fetchAnimals({ activeOnly: true }),
        fetchDistinctSpecies(),
      ])
      if (animalsRes.data) setAnimals(animalsRes.data)
      if (speciesRes.data) setSpeciesList(speciesRes.data)
    }
    load()
  }, [])

  const filteredAnimals = animals.filter(
    (a) =>
      a.name.toLowerCase().includes(animalSearch.toLowerCase()) ||
      (a.tag_number && a.tag_number.toLowerCase().includes(animalSearch.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <label className="form-label">Scope *</label>
      <div className="space-y-2">
        {[
          { value: 'animal', label: 'Specific Animal' },
          { value: 'species', label: 'All of a Species' },
          { value: 'common', label: 'Whole Farm' },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scope"
              value={opt.value}
              checked={scopeType === opt.value}
              onChange={() => setScopeType(opt.value)}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>
      {errors.scopeType && <p className="form-error">{errors.scopeType}</p>}

      {scopeType === 'animal' && (
        <div>
          <label className="form-label">Search Animal</label>
          <input
            type="text"
            value={animalSearch}
            onChange={(e) => setAnimalSearch(e.target.value)}
            placeholder="Search by name or tag..."
            className="form-input mb-2"
          />
          <select
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            className="form-input"
            size={Math.min(6, Math.max(3, filteredAnimals.length))}
          >
            <option value="">Select an animal</option>
            {filteredAnimals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.tag_number ? `(${a.tag_number})` : ''} — {a.species}
              </option>
            ))}
          </select>
          {errors.animalId && <p className="form-error">{errors.animalId}</p>}
        </div>
      )}

      {scopeType === 'species' && (
        <div>
          <label className="form-label">Species *</label>
          <select value={species} onChange={(e) => setSpecies(e.target.value)} className="form-input">
            <option value="">Select species</option>
            {speciesList.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          {errors.species && <p className="form-error">{errors.species}</p>}
        </div>
      )}
    </div>
  )
}
