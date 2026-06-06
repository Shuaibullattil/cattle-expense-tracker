import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context'
import { Sidebar } from './Sidebar'

export default function Layout() {
  const { signOut } = useAuth()
  const [sidebarState, setSidebarState] = useState('hidden')

  useEffect(() => {
    function syncSidebarState() {
      const width = window.innerWidth
      if (width >= 1024) {
        setSidebarState('full')
      } else if (width >= 768) {
        setSidebarState('icons')
      } else {
        setSidebarState('hidden')
      }
    }

    syncSidebarState()
    window.addEventListener('resize', syncSidebarState)
    return () => window.removeEventListener('resize', syncSidebarState)
  }, [])

  function toggleSidebar() {
    const width = window.innerWidth
    if (width >= 1024) {
      setSidebarState((current) => (current === 'full' ? 'icons' : 'full'))
    } else if (width >= 768) {
      setSidebarState((current) => (current === 'full' ? 'icons' : 'full'))
    } else {
      setSidebarState((current) => (current === 'full' ? 'hidden' : 'full'))
    }
  }

  function closeSidebar() {
    setSidebarState(window.innerWidth >= 768 ? 'icons' : 'hidden')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        sidebarState={sidebarState}
        toggleSidebar={toggleSidebar}
        closeSidebar={closeSidebar}
        onLogout={signOut}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          sidebarState === 'full' ? 'md:pl-14 lg:pl-64' : sidebarState === 'icons' ? 'md:pl-14' : ''
        }`}
      >
        <main className="flex-1 p-3 pt-16 sm:p-5 sm:pt-16 md:pt-5 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
