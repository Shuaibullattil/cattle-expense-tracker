import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAllData } from '../api/settings'
export default function Settings() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDeleteAll = async () => {
    if (!canConfirm) return
    setDeleting(true)
    setError('')
    const { error: err } = await deleteAllData()
    setDeleting(false)
    setConfirmOpen(false)
    setConfirmText('')

    if (err) {
      setError(err)
      return
    }

    setSuccess('All farm data has been deleted.')
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="page-title">Settings</h2>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <section className="card border-amber-200">
        <h3 className="text-lg font-semibold text-gray-900">Development</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Tools for local development and testing. Do not use in production with real farm records.
        </p>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <h4 className="font-semibold text-red-800">Delete all data</h4>
          <p className="mt-2 text-sm text-red-700 leading-relaxed">
            This permanently erases every animal, expense, income entry, and expense split from the
            database. It cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmText('')
              setConfirmOpen(true)
            }}
            className="btn-danger mt-4"
          >
            Delete all data
          </button>
        </div>
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete all data?</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              This will completely wipe animals, expenses, income, and allocations. Type{' '}
              <strong>DELETE</strong> below to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="form-input mt-4"
              autoComplete="off"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false)
                  setConfirmText('')
                }}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={!canConfirm || deleting}
                className="btn-danger"
              >
                {deleting ? 'Deleting...' : 'Delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
