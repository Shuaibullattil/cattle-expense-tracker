export function getScopeType(record) {
  if (record.is_common) return 'common'
  if (record.animal_id) return 'animal'
  if (record.species) return 'species'
  return 'unknown'
}

export function getScopeLabel(record, animalsMap = {}) {
  if (record.is_common) return 'All Farm'
  if (record.animal_id) {
    const animal = animalsMap[record.animal_id]
    return animal ? animal.name : 'Unknown Animal'
  }
  if (record.species) {
    return `All ${record.species.charAt(0).toUpperCase() + record.species.slice(1)}`
  }
  return '—'
}

export function buildScopePayload(scopeType, animalId, species) {
  if (scopeType === 'animal') {
    return { animal_id: animalId, species: null, is_common: false }
  }
  if (scopeType === 'species') {
    return { animal_id: null, species: species?.toLowerCase(), is_common: false }
  }
  return { animal_id: null, species: null, is_common: true }
}
