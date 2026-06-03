import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAnimal, fetchAnimalById, fetchAnimals, updateAnimal } from '../api/animals'
import LoadingSpinner from '../components/LoadingSpinner'

const SPECIES_SUGGESTIONS = ['Buffalo', 'Cow', 'Goat', 'Sheep']

export default function AddAnimal() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState({})
  const [mothers, setMothers] = useState([])

  const [name, setName] = useState('')
  const [tagNumber, setTagNumber] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [acquisitionType, setAcquisitionType] = useState('purchased')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchasedFrom, setPurchasedFrom] = useState('')
  const [motherId, setMotherId] = useState('')

  useEffect(() => {
    fetchAnimals({ activeOnly: true }).then(({ data }) => {
      if (data) setMothers(data.filter((a) => a.id !== id))
    })
  }, [id])

  useEffect(() => {
    if (!isEdit) return
    async function load() {
      const { data, error: err } = await fetchAnimalById(id)
      if (err) setError(err)
      else if (data) {
        setName(data.name)
        setTagNumber(data.tag_number || '')
        setSpecies(data.species)
        setBreed(data.breed || '')
        setAcquisitionType(data.acquisition_type)
        setAcquisitionDate(data.acquisition_date)
        setPurchasePrice(data.purchase_price?.toString() || '')
        setPurchasedFrom(data.purchased_from || '')
        setMotherId(data.mother_id || '')
      }
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!species.trim()) e.species = 'Species is required'
    if (!acquisitionDate) e.acquisitionDate = 'Date is required'
    if (acquisitionType === 'purchased') {
      if (!purchasePrice || Number(purchasePrice) <= 0) e.purchasePrice = 'Purchase price is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    if (!validate()) return

    setSubmitting(true)
    const payload = {
      name: name.trim(),
      tag_number: tagNumber.trim() || null,
      species: species.trim().toLowerCase(),
      breed: breed.trim() || null,
      acquisition_type: acquisitionType,
      acquisition_date: acquisitionDate,
      purchase_price: acquisitionType === 'purchased' ? Number(purchasePrice) : null,
      purchased_from: acquisitionType === 'purchased' ? purchasedFrom.trim() || null : null,
      mother_id: acquisitionType === 'born' ? motherId || null : null,
    }

    const result = isEdit
      ? await updateAnimal(id, payload)
      : await createAnimal(payload)

    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(isEdit ? 'Animal updated!' : 'Animal added!')
    setTimeout(() => navigate('/animals'), 1500)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl">
      <h2 className="page-title">{isEdit ? 'Edit Animal' : 'Add Animal'}</h2>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="form-label">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div>
          <label className="form-label">Tag Number</label>
          <input value={tagNumber} onChange={(e) => setTagNumber(e.target.value)} className="form-input" />
        </div>

        <div>
          <label className="form-label">Species *</label>
          <input
            list="species-list"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="form-input"
          />
          <datalist id="species-list">
            {SPECIES_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {errors.species && <p className="form-error">{errors.species}</p>}
        </div>

        <div>
          <label className="form-label">Breed</label>
          <input value={breed} onChange={(e) => setBreed(e.target.value)} className="form-input" />
        </div>

        <div>
          <label className="form-label">Acquisition Type *</label>
          <div className="flex gap-6 mt-2">
            {[
              { value: 'purchased', label: 'Purchased' },
              { value: 'born', label: 'Born in Farm' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={acquisitionType === opt.value}
                  onChange={() => setAcquisitionType(opt.value)}
                  className="text-green-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {acquisitionType === 'purchased' ? (
          <>
            <div>
              <label className="form-label">Purchase Date *</label>
              <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="form-input" />
              {errors.acquisitionDate && <p className="form-error">{errors.acquisitionDate}</p>}
            </div>
            <div>
              <label className="form-label">Purchase Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="form-input" />
              {errors.purchasePrice && <p className="form-error">{errors.purchasePrice}</p>}
            </div>
            <div>
              <label className="form-label">Purchased From</label>
              <input value={purchasedFrom} onChange={(e) => setPurchasedFrom(e.target.value)} className="form-input" placeholder="Seller or market name" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="form-label">Birth Date *</label>
              <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="form-input" />
              {errors.acquisitionDate && <p className="form-error">{errors.acquisitionDate}</p>}
            </div>
            <div>
              <label className="form-label">Mother (optional)</label>
              <select value={motherId} onChange={(e) => setMotherId(e.target.value)} className="form-input">
                <option value="">No mother selected</option>
                {mothers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.species}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : isEdit ? 'Update Animal' : 'Add Animal'}
          </button>
          <button type="button" onClick={() => navigate('/animals')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
