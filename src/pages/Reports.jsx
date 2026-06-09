import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { HiOutlineArrowDownTray } from 'react-icons/hi2'
import { fetchAnimals } from '../api/animals'
import { fetchExpenseAllocations, fetchExpenses } from '../api/expenses'
import { fetchIncome } from '../api/income'
import { fetchMilkings } from '../api/milking'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatCurrency, formatDate, categoryLabel } from '../utils/format'
import { calcAnimalFinancials } from '../utils/aggregations'
import { buildIncomeAllocations } from '../utils/incomeSplit'
import { getScopeLabel } from '../utils/scope'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [animals, setAnimals] = useState([])
  const [expenses, setExpenses] = useState([])
  const [allocations, setAllocations] = useState([])
  const [income, setIncome] = useState([])
  const [milkings, setMilkings] = useState([])
  
  // Date filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState('financial')
  const [animalFilter, setAnimalFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [aRes, eRes, allocRes, iRes, mRes] = await Promise.all([
        fetchAnimals(),
        fetchExpenses(),
        fetchExpenseAllocations(),
        fetchIncome(),
        fetchMilkings(),
      ])
      if (aRes.error || eRes.error || allocRes.error || iRes.error) {
        setError(aRes.error || eRes.error || allocRes.error || iRes.error)
      } else {
        setAnimals(aRes.data)
        setExpenses(eRes.data)
        setAllocations(allocRes.data)
        setIncome(iRes.data)
        setMilkings(mRes.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error && !expenses.length) return <div className="alert-error">{error}</div>

  // Generate dynamic income allocations
  const incomeAllocations = buildIncomeAllocations(income, animals)
  const animalsMap = Object.fromEntries(animals.map((a) => [a.id, a]))

  // Filter datasets based on date range
  let filteredExpenses = expenses
  let filteredIncome = income

  if (startDate) {
    filteredExpenses = filteredExpenses.filter((e) => e.date >= startDate)
    filteredIncome = filteredIncome.filter((i) => i.date >= startDate)
  }
  if (endDate) {
    filteredExpenses = filteredExpenses.filter((e) => e.date <= endDate)
    filteredIncome = filteredIncome.filter((i) => i.date <= endDate)
  }

  // Get distinct species
  const allSpecies = [...new Set(animals.map((a) => a.species?.toLowerCase()).filter(Boolean))].sort()

  // 1. Per Species Summary Table Data
  const speciesTableData = allSpecies.map((sp) => {
    const speciesAnimals = animals.filter((a) => a.species?.toLowerCase() === sp)
    let spExpenses = 0
    let spIncome = 0
    let spPurchaseCost = 0
    let spSalePrice = 0

    for (const a of speciesAnimals) {
      const fin = calcAnimalFinancials(
        a,
        filteredExpenses,
        filteredIncome,
        allocations,
        incomeAllocations,
        startDate,
        endDate
      )
      spExpenses += fin.animalExpenses
      spIncome += fin.animalIncome
      spPurchaseCost += fin.purchaseCost
      spSalePrice += fin.salePrice
    }

    const net = spIncome + spSalePrice - spExpenses - spPurchaseCost
    return {
      Species: sp.charAt(0).toUpperCase() + sp.slice(1),
      ActiveCount: speciesAnimals.filter((a) => !a.is_sold).length,
      SoldCount: speciesAnimals.filter((a) => a.is_sold).length,
      Expenses: spExpenses,
      Income: spIncome,
      Net: net,
    }
  })

  // 2. Per Animal Summary Table Data
  const animalTableData = animals.map((a) => {
    const fin = calcAnimalFinancials(
      a,
      filteredExpenses,
      filteredIncome,
      allocations,
      incomeAllocations,
      startDate,
      endDate
    )
    return {
      id: a.id,
      Name: a.name,
      Species: a.species ? a.species.charAt(0).toUpperCase() + a.species.slice(1).toLowerCase() : '—',
      Status: a.is_sold ? 'Sold' : 'Active',
      PurchaseCost: fin.purchaseCost,
      Expenses: fin.animalExpenses,
      Income: fin.animalIncome,
      SalePrice: fin.salePrice,
      Net: fin.net,
    }
  }).sort((a, b) => b.Net - a.Net)

  // 3. Expense-Amount Table Data
  const expenseTableData = filteredExpenses.map((e) => {
    return {
      id: e.id,
      Date: e.date,
      Category: categoryLabel(e.category),
      Scope: getScopeLabel(e, animalsMap),
      Amount: Number(e.amount),
      Notes: e.notes || '—',
    }
  })

  // Helper function to export to Excel
  const exportTableToExcel = (data, filename, sheetName) => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    const dateSuffix = startDate || endDate
      ? `-${startDate || 'all'}-to-${endDate || 'present'}`
      : `-${new Date().toISOString().slice(0, 10)}`
    XLSX.writeFile(wb, `${filename}${dateSuffix}.xlsx`)
  }

  const exportMilkingExcel = () => {
    const data = milkings
      .filter((m) => {
        if (startDate && m.date < startDate) return false
        if (endDate && m.date > endDate) return false
        if (animalFilter && m.animal_id !== animalFilter) return false
        return true
      })
      .map((m) => ({ Date: formatDate(m.date), Animal: (animals.find((a) => a.id === m.animal_id) || {}).name || '—', Quantity: Number(m.quantity || 0), Notes: m.notes || '—' }))
    exportTableToExcel(data, 'milking-report', 'Milking')
  }

  const exportSpeciesExcel = () => {
    const data = speciesTableData.map((row) => ({
      Species: row.Species,
      'Active Animals': row.ActiveCount,
      'Sold Animals': row.SoldCount,
      'Total Expenses (₹)': row.Expenses,
      'Total Income (₹)': row.Income,
      'Net P/L (₹)': row.Net,
    }))
    exportTableToExcel(data, 'species-financial-summary', 'Species Summary')
  }

  const exportAnimalExcel = () => {
    const data = animalTableData.map((row) => ({
      Name: row.Name,
      Species: row.Species,
      Status: row.Status,
      'Purchase Cost (₹)': row.PurchaseCost,
      'Expenses (₹)': row.Expenses,
      'Income (₹)': row.Income,
      'Sale Price (₹)': row.SalePrice,
      'Net P/L (₹)': row.Net,
    }))
    exportTableToExcel(data, 'animal-financial-summary', 'Animal Summary')
  }

  const exportExpenseExcel = () => {
    const data = expenseTableData.map((row) => ({
      Date: formatDate(row.Date),
      Category: row.Category,
      Scope: row.Scope,
      'Amount (₹)': row.Amount,
      Notes: row.Notes,
    }))
    exportTableToExcel(data, 'expense-statement', 'Expenses')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="page-title mb-0">{reportType === 'financial' ? 'Financial Reports' : 'Milking Report'}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setReportType('financial')} className={`px-3 py-1 rounded-full text-xs font-medium ${reportType === 'financial' ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border'}`}>
            Financial
          </button>
          <button onClick={() => setReportType('milking')} className={`px-3 py-1 rounded-full text-xs font-medium ${reportType === 'milking' ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border'}`}>
            Milking
          </button>
        </div>
        
        {/* Global Date Filter */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm self-start sm:self-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs border-0 bg-transparent p-0 focus:ring-0 w-28 text-gray-700"
            placeholder="Start date"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs border-0 bg-transparent p-0 focus:ring-0 w-28 text-gray-700"
            placeholder="End date"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="text-xs font-medium text-red-600 hover:text-red-700 pl-1 border-l border-gray-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {reportType === 'financial' && (
        <>
          {/* 1. Per Species Summary Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Per-Species Summary</h3>
            <p className="text-xs text-gray-500">Aggregated financial health for each animal species.</p>
          </div>
          <button onClick={exportSpeciesExcel} className="btn-secondary min-h-0 py-1.5 px-3 rounded-lg text-xs gap-1.5">
            <HiOutlineArrowDownTray size={14} aria-hidden />
            Download
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Active</th>
                <th>Sold</th>
                <th>Expenses</th>
                <th>Income</th>
                <th>Net P/L</th>
              </tr>
            </thead>
            <tbody>
              {speciesTableData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No species data available.</td>
                </tr>
              ) : (
                speciesTableData.map((row) => (
                  <tr key={row.Species}>
                    <td className="font-medium text-gray-900">{row.Species}</td>
                    <td>{row.ActiveCount}</td>
                    <td>{row.SoldCount}</td>
                    <td className="text-red-600 font-medium">{formatCurrency(row.Expenses)}</td>
                    <td className="text-green-600 font-medium">{formatCurrency(row.Income)}</td>
                    <td className={`font-semibold ${row.Net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(row.Net)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Milking Report Section */}
        </>
      )}

      {reportType === 'milking' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Milking Records</h3>
              <p className="text-xs text-gray-500">Export and inspect milking records for selected period.</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={animalFilter} onChange={(e) => setAnimalFilter(e.target.value)} className="text-xs border-0 bg-transparent p-1">
                <option value="">All animals</option>
                {animals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={exportMilkingExcel} className="btn-secondary min-h-0 py-1.5 px-3 rounded-lg text-xs gap-1.5">
                <HiOutlineArrowDownTray size={14} aria-hidden />
                Download
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Animal</th>
                  <th>Quantity (L)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {milkings.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">No milking records available.</td></tr>
                ) : (
                  milkings
                    .filter((m) => {
                      if (startDate && m.date < startDate) return false
                      if (endDate && m.date > endDate) return false
                      if (animalFilter && m.animal_id !== animalFilter) return false
                      return true
                    })
                    .map((m) => (
                      <tr key={m.id}>
                        <td>{formatDate(m.date)}</td>
                        <td>{(animals.find((a) => a.id === m.animal_id) || {}).name || '—'}</td>
                        <td className="font-medium text-green-700">{m.quantity}</td>
                        <td className="max-w-xs truncate">{m.notes || '—'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'financial' && (
        <>
      {/* 2. Per Animal Summary Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Per-Animal Summary</h3>
            <p className="text-xs text-gray-500">Breakdown of purchase costs, operating expenses, revenues, and final profit margin per head.</p>
          </div>
          <button onClick={exportAnimalExcel} className="btn-secondary min-h-0 py-1.5 px-3 rounded-lg text-xs gap-1.5">
            <HiOutlineArrowDownTray size={14} aria-hidden />
            Download
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Species</th>
                <th>Status</th>
                <th>Purchase Cost</th>
                <th>Expenses</th>
                <th>Income</th>
                <th>Sale Price</th>
                <th>Net P/L</th>
              </tr>
            </thead>
            <tbody>
              {animalTableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">No animal data available.</td>
                </tr>
              ) : (
                animalTableData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-gray-900">{row.Name}</td>
                    <td>{row.Species}</td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.Status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {row.Status}
                      </span>
                    </td>
                    <td>{formatCurrency(row.PurchaseCost)}</td>
                    <td className="text-red-600">{formatCurrency(row.Expenses)}</td>
                    <td className="text-green-600">{formatCurrency(row.Income)}</td>
                    <td>{row.Status === 'Sold' ? formatCurrency(row.SalePrice) : '—'}</td>
                    <td className={`font-semibold ${row.Net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(row.Net)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Expense-Amount Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Expense Statement</h3>
            <p className="text-xs text-gray-500">Comprehensive list of all expenses incurred during the selected period.</p>
          </div>
          <button onClick={exportExpenseExcel} className="btn-secondary min-h-0 py-1.5 px-3 rounded-lg text-xs gap-1.5">
            <HiOutlineArrowDownTray size={14} aria-hidden />
            Download
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Scope</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {expenseTableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">No expenses recorded for this period.</td>
                </tr>
              ) : (
                expenseTableData.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.Date)}</td>
                    <td className="font-medium text-gray-900">{row.Category}</td>
                    <td>{row.Scope}</td>
                    <td className="text-red-600 font-medium">{formatCurrency(row.Amount)}</td>
                    <td className="text-gray-500 max-w-xs truncate">{row.Notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
