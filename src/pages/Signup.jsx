import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { APP_ICON } from '../constants/selectOptions'

export default function Signup() {
  const { session, signUp, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setSubmitError('')
    setSuccess('')
    if (!validate()) return
    setSubmitting(true)
    const { error } = await signUp(email.trim(), password)
    setSubmitting(false)
    if (error) {
      setSubmitError(error.message)
      return
    }
    setSuccess('Account created! You can now sign in.')
    setTimeout(() => navigate('/login'), 2000)
  }

  const Logo = APP_ICON

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="text-5xl text-green-700 mx-auto" aria-hidden />
          <h1 className="mt-3 text-2xl font-bold text-green-800">Farm Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        {submitError && <div className="alert-error mb-4">{submitError}</div>}
        {success && <div className="alert-success mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              autoComplete="email"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="new-password"
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-700 hover:text-green-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
