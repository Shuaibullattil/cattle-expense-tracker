import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAnimalById, markAnimalSold } from '../api/animals'
import { fetchExpensesForAnimal } from '../api/expenses'
import { fetchIncomeForAnimal } from '../api/income'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  formatCurrency,
  formatDate,
  acquisitionTypeLabel,
  capitalizeSpecies,
  categoryLabel,
  incomeTypeLabel,
} from '../utils/format'
import { calcAnimalFinancials } from '../utils/aggregations'

export default function AnimalDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState('expenses')
  const [animal, setAnimal] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [saleDate, setSaleDate] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [soldTo, setSoldTo] = useState('')
  const [saleErrors, setSaleErrors] = useState({})
  const [saleSubmitting, setSaleSubmitting] = useState(false)
  const [saleSuccess, setSaleSuccess] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [aRes, eRes, iRes] = await Promise.all([
        fetchAnimalById(id),
        fetchExpensesForAnimal(id),
        fetchIncomeForAnimal(id),
      ])
      if (aRes.error) setError(aRes.error)
      else {
        setAnimal(aRes.data)
        setExpenses(eRes.data || [])
        setIncome(iRes.data || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleMarkSold = async (ev) => {
    ev.preventDefault()
    const e = {}
    if (!saleDate) e.saleDate = 'Sale date is required'
    if (!salePrice || Number(salePrice) <= 0) e.salePrice = 'Sale price is required'
    setSaleErrors(e)
    if (Object.keys(e).length > 0) return

    setSaleSubmitting(true)
    const { data, error: err } = await markAnimalSold(id, {
      sale_date: saleDate,
      sale_price: Number(salePrice),
      sold_to: soldTo.trim() || null,
    })
    setSaleSubmitting(false)
    if (err) setError(err)
    else {
      setAnimal(data)
      setShowSaleForm(false)
      setSaleSuccess('Animal marked as sold!')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error && !animal) return <div className="alert-error">{error}</div>
  if (!animal) return <div className="alert-error">Animal not found.</div>

  const directExpenses = expenses.filter((e) => !e.isSplit)
  const splitAllocations = expenses
    .filter((e) => e.isSplit)
    .map((e) => ({ animal_id: id, amount: e.displayAmount }))
  const { animalExpenses, animalIncome, purchaseCost, net } = calcAnimalFinancials(
    animal,
    directExpenses,
    income,
    splitAllocations,
  )

  const motherName = animal.mother?.name

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link to="/animals" className="text-sm text-green-700 hover:underline mb-2 inline-block">← Back to Animals</Link>
          <h2 className="text-2xl font-bold text-gray-900">{animal.name}</h2>
          {animal.is_sold && (
            <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Sold</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/animals/${id}/edit`} className="btn-secondary">Edit</Link>
          {!animal.is_sold && (
            <button type="button" onClick={() => setShowSaleForm(!showSaleForm)} className="btn-primary">
              Mark as Sold
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {saleSuccess && <div className="alert-success mb-4">{saleSuccess}</div>}

      {showSaleForm && !animal.is_sold && (
        <form onSubmit={handleMarkSold} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Sale Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Sale Date *</label>
              <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="form-input" />
              {saleErrors.saleDate && <p className="form-error">{saleErrors.saleDate}</p>}
            </div>
            <div>
              <label className="form-label">Sale Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="form-input" />
              {saleErrors.salePrice && <p className="form-error">{saleErrors.salePrice}</p>}
            </div>
            <div>
              <label className="form-label">Sold To</label>
              <input value={soldTo} onChange={(e) => setSoldTo(e.target.value)} className="form-input" />
            </div>
          </div>
          <button type="submit" disabled={saleSubmitting} className="btn-primary">
            {saleSubmitting ? 'Saving...' : 'Confirm Sale'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-gray-500">Purchase Cost</p>
          <p className="text-lg font-bold">{formatCurrency(purchaseCost)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(animalExpenses)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Total Income</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(animalIncome)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500">Net P/L</p>
          <p className={`text-lg font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(net)}</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {['expenses', 'income', 'info'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${
              tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Tag Number" value={animal.tag_number || '—'} />
          <InfoRow label="Species" value={capitalizeSpecies(animal.species)} />
          <InfoRow label="Breed" value={animal.breed || '—'} />
          <InfoRow label="Acquisition" value={acquisitionTypeLabel(animal.acquisition_type)} />
          <InfoRow label="Acquisition Date" value={formatDate(animal.acquisition_date)} />
          {animal.acquisition_type === 'purchased' && (
            <>
              <InfoRow label="Purchase Price" value={formatCurrency(animal.purchase_price)} />
              <InfoRow label="Purchased From" value={animal.purchased_from || '—'} />
            </>
          )}
          {animal.acquisition_type === 'born' && (
            <InfoRow label="Mother" value={motherName || '—'} />
          )}
          {animal.is_sold && (
            <>
              <InfoRow label="Sale Date" value={formatDate(animal.sale_date)} />
              <InfoRow label="Sale Price" value={formatCurrency(animal.sale_price)} />
              <InfoRow label="Sold To" value={animal.sold_to || '—'} />
            </>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No expenses for this animal.</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.rowKey || e.id}>
                    <td>{formatDate(e.date)}</td>
                    <td>{categoryLabel(e.category)}</td>
                    <td className="font-medium text-red-700">
                      {formatCurrency(e.displayAmount ?? e.amount)}
                    </td>
                    <td className="text-sm text-gray-600">
                      {e.isSplit && (
                        <span className="block text-xs text-green-700 mb-0.5">
                          {e.splitNote} — total {formatCurrency(e.totalExpenseAmount)}
                        </span>
                      )}
                      {e.notes || (e.isSplit ? '' : '—')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'income' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Quantity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {income.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No income for this animal.</td></tr>
              ) : (
                income.map((i) => (
                  <tr key={i.id}>
                    <td>{formatDate(i.date)}</td>
                    <td>{incomeTypeLabel(i.type)}</td>
                    <td>{formatCurrency(i.amount)}</td>
                    <td>{i.quantity ? `${i.quantity} ${i.unit || ''}` : '—'}</td>
                    <td>{i.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}
