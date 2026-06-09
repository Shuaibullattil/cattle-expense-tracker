import { useEffect, useMemo, useState } from 'react'
import { fetchAnimals, fetchDistinctSpecies } from '../api/animals'
import { SCOPE_OPTIONS, animalSelectOptions, speciesSelectOptions } from '../constants/selectOptions'
import StyledSelect from './StyledSelect'

export default function ScopeSelector({
  scopeType,
  setScopeType,
  animalId,
  setAnimalId,
  species,
  setSpecies,
  scopeOptions = SCOPE_OPTIONS,
  errors = {},
}) {
  const [animals, setAnimals] = useState([])
  const [speciesList, setSpeciesList] = useState([])
  const [animalSearch, setAnimalSearch] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const [animalsRes, speciesRes] = await Promise.all([
        fetchAnimals({ status: 'active' }),
        fetchDistinctSpecies(),
      ])
      if (!active) return
      if (animalsRes.data) setAnimals(animalsRes.data)
      if (speciesRes.data) setSpeciesList(speciesRes.data)
    })()
    return () => { active = false }
  }, [])

  const filteredAnimals = useMemo(
    () =>
      animals.filter(
        (a) =>
          a.name.toLowerCase().includes(animalSearch.toLowerCase()) ||
          (a.tag_number && a.tag_number.toLowerCase().includes(animalSearch.toLowerCase()))
      ),
    [animals, animalSearch],
  )

  const animalOptions = useMemo(
    () => animalSelectOptions(filteredAnimals),
    [filteredAnimals],
  )

  return (
    <div className="space-y-4">
      <label className="form-label">Scope *</label>
      <div className="grid grid-cols-1 gap-2">
        {scopeOptions.map((opt) => {
          const Icon = opt.Icon
          const selected = scopeType === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setScopeType(opt.value)}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl border text-sm font-medium transition-all min-h-[48px] ${opt.color} ${
                selected ? 'ring-2 ring-green-600 ring-offset-1' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <Icon size={20} aria-hidden />
              <span className="flex-1 text-left">{opt.label}</span>
            </button>
          )
        })}
      </div>
      {errors.scopeType && <p className="form-error">{errors.scopeType}</p>}

      {scopeType === 'animal' && (
        <div className="space-y-2">
          <label className="form-label">Animal *</label>
          <input
            type="search"
            value={animalSearch}
            onChange={(e) => setAnimalSearch(e.target.value)}
            placeholder="Search name or tag…"
            className="form-input"
          />
          <StyledSelect
            value={animalId}
            onChange={setAnimalId}
            placeholder="Select animal"
            options={animalOptions}
          />
          {errors.animalId && <p className="form-error">{errors.animalId}</p>}
        </div>
      )}

      {scopeType === 'species' && (
        <div>
          <label className="form-label">Species *</label>
          <StyledSelect
            value={species}
            onChange={setSpecies}
            placeholder="Select species"
            options={speciesSelectOptions(speciesList).filter((o) => o.value !== '')}
          />
          {errors.species && <p className="form-error">{errors.species}</p>}
        </div>
      )}
    </div>
  )
}
