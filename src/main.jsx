import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))

function EnvSetupMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md rounded-xl bg-white p-8 shadow-lg border border-amber-200">
        <h1 className="text-xl font-bold text-gray-900">Configuration required</h1>
        <p className="mt-3 text-gray-600 text-sm leading-relaxed">
          Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the project root
          with your Supabase credentials, then restart the dev server:
        </p>
        <pre className="mt-4 rounded-lg bg-gray-900 text-green-400 text-xs p-4 overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="mt-4 text-xs text-gray-500">
          Find these in Supabase → Project Settings → API (use the <strong>anon public</strong> key).
        </p>
      </div>
    </div>
  )
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  root.render(
    <StrictMode>
      <EnvSetupMessage />
    </StrictMode>,
  )
} else {
  import('./App.jsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
