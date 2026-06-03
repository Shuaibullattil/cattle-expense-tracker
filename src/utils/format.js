export function formatCurrency(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function categoryLabel(category) {
  const labels = {
    feed: 'Feed',
    medicine: 'Medicine',
    vet: 'Vet',
    labour: 'Labour',
    equipment: 'Equipment',
    other: 'Other',
  }
  return labels[category] || category
}

export function incomeTypeLabel(type) {
  const labels = {
    milk_sale: 'Milk Sale',
    manure: 'Manure',
    other: 'Other',
  }
  return labels[type] || type
}

export function acquisitionTypeLabel(type) {
  return type === 'purchased' ? 'Purchased' : 'Born in Farm'
}

export function capitalizeSpecies(species) {
  if (!species) return ''
  return species.charAt(0).toUpperCase() + species.slice(1).toLowerCase()
}
