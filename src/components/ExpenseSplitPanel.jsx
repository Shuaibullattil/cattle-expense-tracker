import { useEffect, useMemo, useState } from 'react'
import { fetchAnimals } from '../api/animals'
import { formatCurrency, capitalizeSpecies } from '../utils/format'
import { filterEligibleAnimals, getIncludedAnimals, splitAmount } from '../utils/expenseSplit'
import LoadingSpinner from './LoadingSpinner'

export default function ExpenseSplitPanel({
  scopeType,
  species,
  totalAmount,
  excludedAnimalIdsRef,
}) {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(false)
  const [excludedAnimalIds, setExcludedAnimalIds] = useState([])

  useEffect(() => {
    excludedAnimalIdsRef.current = excludedAnimalIds
  }, [excludedAnimalIds, excludedAnimalIdsRef])

  useEffect(() => {
    if (scopeType !== 'species' && scopeType !== 'common') return

    let active = true
    ;(async () => {
      setLoading(true)
      const { data } = await fetchAnimals({ activeOnly: true })
      if (!active) return
      setAnimals(data || [])
      setLoading(false)
    })()
    return () => { active = false }
  }, [scopeType, species])

  const eligible = useMemo(
    () => filterEligibleAnimals(animals, scopeType, species),
    [animals, scopeType, species],
  )

  const included = useMemo(
    () => getIncludedAnimals(eligible, excludedAnimalIds),
    [eligible, excludedAnimalIds],
  )

  const shares = useMemo(() => {
    const amt = Number(totalAmount)
    if (!amt || included.length === 0) return []
    return splitAmount(amt, included.length)
  }, [totalAmount, included.length])

  if (scopeType !== 'species' && scopeType !== 'common') return null
  if (scopeType === 'species' && !species) return null

  const toggleExclude = (animalId) => {
    setExcludedAnimalIds((prev) =>
      prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId],
    )
  }

  const title =
    scopeType === 'common'
      ? 'Split across all active animals on the farm'
      : `Split across all active ${capitalizeSpecies(species)}`

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-green-900">{title}</h3>
        <p className="text-xs text-green-800 mt-1">
          Uncheck an animal to exclude them — their share will not be counted on their record.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner size="sm" />
      ) : eligible.length === 0 ? (
        <p className="text-sm text-amber-700">No active animals match this scope. Add animals first.</p>
      ) : (
        <>
          {totalAmount && included.length > 0 && (
            <p className="text-sm font-medium text-green-800">
              {formatCurrency(Number(totalAmount))} ÷ {included.length} ={' '}
              <span className="text-green-900">{formatCurrency(shares[0] || 0)}</span> per included animal
            </p>
          )}

          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {eligible.map((animal) => {
              const excluded = excludedAnimalIds.includes(animal.id)
              const includedIndex = included.findIndex((a) => a.id === animal.id)
              const share = includedIndex >= 0 ? shares[includedIndex] : null

              return (
                <li
                  key={animal.id}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                    excluded ? 'bg-gray-100 text-gray-500' : 'bg-white border border-green-100'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={!excluded}
                      onChange={() => toggleExclude(animal.id)}
                      className="rounded text-green-600 focus:ring-green-500 shrink-0"
                    />
                    <span className="truncate">
                      {animal.name}
                      {animal.tag_number ? ` (${animal.tag_number})` : ''}
                    </span>
                  </label>
                  <span className="shrink-0 text-xs font-medium">
                    {excluded ? 'Excluded' : share != null ? formatCurrency(share) : '—'}
                  </span>
                </li>
              )
            })}
          </ul>

          {included.length === 0 && (
            <p className="text-sm text-red-600">Include at least one animal to save this expense.</p>
          )}
        </>
      )}
    </div>
  )
}
