/** Split total equally in rupees; remainder paise go to first animals. */
export function splitAmount(total, count) {
  if (count <= 0) return []
  const totalPaise = Math.round(Number(total) * 100)
  const base = Math.floor(totalPaise / count)
  const remainder = totalPaise % count
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100)
}

export function filterEligibleAnimals(animals, scopeType, species) {
  const active = animals.filter((a) => !a.is_sold)
  if (scopeType === 'species' && species) {
    const sp = species.toLowerCase()
    return active.filter((a) => a.species?.toLowerCase() === sp)
  }
  if (scopeType === 'common') {
    return active
  }
  return []
}

export function getIncludedAnimals(eligible, excludedAnimalIds) {
  const excluded = new Set(excludedAnimalIds)
  return eligible.filter((a) => !excluded.has(a.id))
}
