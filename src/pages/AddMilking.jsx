import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMilking } from '../api/milking'
import { fetchAnimals } from '../api/animals'
import StyledSelect from '../components/StyledSelect'
import { animalSelectOptions } from '../constants/selectOptions'
import { todayISO } from '../utils/format'

export default function AddMilking() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [animalId, setAnimalId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [animals, setAnimals] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const aRes = await fetchAnimals()
      if (!mounted) return
      if (aRes.data) setAnimals(aRes.data)
      if (aRes.error) setError(aRes.error)
    })()
    return () => { mounted = false }
  }, [])

  const validate = () => {
    const e = {}
    if (!date) e.date = 'Date is required'
    if (!animalId) e.animalId = 'Select an animal'
    if (!quantity || Number(quantity) <= 0) e.quantity = 'Valid quantity is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    if (!validate()) return
    setSubmitting(true)
    const { error: err } = await createMilking({ animal_id: animalId, date, quantity: Number(quantity), notes: notes.trim() || null })
    setSubmitting(false)
    if (err) {
      setError(err)
      return
    }
    setSuccess('Milking recorded')
    setTimeout(() => navigate('/milking'), 800)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="page-title">Record Milking</h2>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="form-label">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" />
          {errors.date && <p className="form-error">{errors.date}</p>}
        </div>

        <div>
          <label className="form-label">Animal *</label>
          <StyledSelect value={animalId} onChange={setAnimalId} options={animalSelectOptions(animals)} />
          {errors.animalId && <p className="form-error">{errors.animalId}</p>}
        </div>

        <div>
          <label className="form-label">Quantity (litres) *</label>
          <input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="form-input" />
          {errors.quantity && <p className="form-error">{errors.quantity}</p>}
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="form-input" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Record'}
          </button>
          <button type="button" onClick={() => navigate('/milking')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
