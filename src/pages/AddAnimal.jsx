import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAnimal, fetchAnimalById, fetchAnimals, updateAnimal, fetchDistinctSpecies } from '../api/animals'
import LoadingSpinner from '../components/LoadingSpinner'
import StyledSelect from '../components/StyledSelect'
import { animalSelectOptions, SPECIES_ICON_MAP } from '../constants/selectOptions'
import { HiOutlineGlobeAlt } from 'react-icons/hi2'
import { GiCow } from 'react-icons/gi'

const SPECIES_SUGGESTIONS = ['Buffalo', 'Cow', 'Goat', 'Sheep']

export default function AddAnimal() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState({})
  const [mothers, setMothers] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])

  const [name, setName] = useState('')
  const [tagNumber, setTagNumber] = useState('')
  const [species, setSpecies] = useState('')
  const [customSpecies, setCustomSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [acquisitionType, setAcquisitionType] = useState('purchased')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchasedFrom, setPurchasedFrom] = useState('')
  const [motherId, setMotherId] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [mothersRes, speciesRes, animalRes] = await Promise.all([
        fetchAnimals({ status: 'active' }),
        fetchDistinctSpecies(),
        isEdit ? fetchAnimalById(id) : Promise.resolve({ data: null, error: null }),
      ])

      if (mothersRes.data) {
        setMothers(mothersRes.data.filter((a) => a.id !== id))
      }

      let editSpecies = ''
      if (isEdit) {
        if (animalRes.error) {
          setError(animalRes.error)
        } else if (animalRes.data) {
          const a = animalRes.data
          setName(a.name)
          setTagNumber(a.tag_number || '')
          editSpecies = a.species || ''
          setBreed(a.breed || '')
          setAcquisitionType(a.acquisition_type)
          setAcquisitionDate(a.acquisition_date)
          setPurchasePrice(a.purchase_price?.toString() || '')
          setPurchasedFrom(a.purchased_from || '')
          setMotherId(a.mother_id || '')
        }
      }

      const dbSpecies = speciesRes.data || []
      const merged = Array.from(
        new Set([
          ...SPECIES_SUGGESTIONS.map((s) => s.toLowerCase()),
          ...dbSpecies.map((s) => s.toLowerCase()),
          ...(editSpecies ? [editSpecies.toLowerCase()] : []),
        ])
      )

      const opts = merged.map((s) => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1),
        color: 'bg-lime-50 text-lime-900 border-lime-200',
        Icon: SPECIES_ICON_MAP[s] || GiCow,
      }))

      opts.push({
        value: '__custom__',
        label: 'Other / Custom…',
        color: 'bg-gray-50 text-gray-800 border-gray-200',
        Icon: HiOutlineGlobeAlt,
      })

      setSpeciesOptions(opts)

      if (editSpecies) {
        const lowerEdit = editSpecies.toLowerCase()
        const isStandardOrDb = SPECIES_SUGGESTIONS.map((s) => s.toLowerCase()).includes(lowerEdit) ||
                               dbSpecies.map((s) => s.toLowerCase()).includes(lowerEdit)
        if (isStandardOrDb) {
          setSpecies(lowerEdit)
        } else {
          setSpecies('__custom__')
          setCustomSpecies(editSpecies)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [id, isEdit])

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Name is required'
    
    if (species === '__custom__') {
      if (!customSpecies.trim()) e.species = 'Species name is required'
    } else if (!species.trim()) {
      e.species = 'Species is required'
    }

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
    const finalSpecies = species === '__custom__' ? customSpecies.trim().toLowerCase() : species.trim().toLowerCase()
    const payload = {
      name: name.trim(),
      tag_number: tagNumber.trim() || null,
      species: finalSpecies,
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
          <StyledSelect
            value={species}
            onChange={(val) => {
              setSpecies(val)
              if (val !== '__custom__') {
                setCustomSpecies('')
              }
            }}
            placeholder="Select species"
            options={speciesOptions}
          />
          {errors.species && <p className="form-error">{errors.species}</p>}
        </div>

        {species === '__custom__' && (
          <div>
            <label className="form-label">Custom Species *</label>
            <input
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              className="form-input"
              placeholder="Enter custom species name (e.g. Horse)"
            />
          </div>
        )}

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
              <StyledSelect
                value={motherId}
                onChange={setMotherId}
                placeholder="No mother selected"
                options={[
                  { value: '', label: 'No mother', color: 'bg-gray-50 text-gray-800 border-gray-200', Icon: HiOutlineGlobeAlt },
                  ...animalSelectOptions(mothers),
                ]}
              />
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
