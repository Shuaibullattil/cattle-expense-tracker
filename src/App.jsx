import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Animals from './pages/Animals'
import AddAnimal from './pages/AddAnimal'
import AnimalDetail from './pages/AnimalDetail'
import Expenses from './pages/Expenses'
import AddExpense from './pages/AddExpense'
import Income from './pages/Income'
import AddIncome from './pages/AddIncome'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/new" element={<AddAnimal />} />
            <Route path="/animals/:id/edit" element={<AddAnimal />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/new" element={<AddExpense />} />
            <Route path="/income" element={<Income />} />
            <Route path="/income/new" element={<AddIncome />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
