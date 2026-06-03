import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createIncome } from '../api/income'
import ScopeSelector from '../components/ScopeSelector'
import StyledSelect from '../components/StyledSelect'
import { INCOME_TYPES } from '../constants/selectOptions'
import { buildScopePayload } from '../utils/scope'
import { todayISO } from '../utils/format'

export default function AddIncome() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [scopeType, setScopeType] = useState('animal')
  const [animalId, setAnimalId] = useState('')
  const [species, setSpecies] = useState('')
  const [type, setType] = useState('milk_sale')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!date) e.date = 'Date is required'
    if (!amount || Number(amount) <= 0) e.amount = 'Valid amount is required'
    if (scopeType === 'animal' && !animalId) e.animalId = 'Please select an animal'
    if (scopeType === 'species' && !species) e.species = 'Please select a species'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    if (!validate()) return

    setSubmitting(true)
    const scope = buildScopePayload(scopeType, animalId, species)
    const { error: err } = await createIncome({
      ...scope,
      date,
      type,
      amount: Number(amount),
      quantity: quantity ? Number(quantity) : null,
      unit: unit.trim() || null,
      notes: notes.trim() || null,
    })
    setSubmitting(false)

    if (err) {
      setError(err)
      return
    }
    setSuccess('Income added successfully!')
    setTimeout(() => navigate('/income'), 1500)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="page-title">Add Income</h2>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="form-label">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" />
          {errors.date && <p className="form-error">{errors.date}</p>}
        </div>

        <ScopeSelector
          scopeType={scopeType}
          setScopeType={setScopeType}
          animalId={animalId}
          setAnimalId={setAnimalId}
          species={species}
          setSpecies={setSpecies}
          errors={errors}
        />

        <div>
          <label className="form-label">Type *</label>
          <StyledSelect value={type} onChange={setType} options={INCOME_TYPES} />
        </div>

        <div>
          <label className="form-label">Amount (₹) *</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="form-input" />
          {errors.amount && <p className="form-error">{errors.amount}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Quantity</label>
            <input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="form-input" placeholder="e.g. 10" />
          </div>
          <div>
            <label className="form-label">Unit</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className="form-input" placeholder="e.g. litres, kg" />
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="form-input" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Add Income'}
          </button>
          <button type="button" onClick={() => navigate('/income')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
