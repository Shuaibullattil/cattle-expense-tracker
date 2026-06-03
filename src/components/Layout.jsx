import { Outlet } from 'react-router-dom'
import { useAuth } from '../context'
import { SidebarDesktop, SidebarMobile } from './Sidebar'

export default function Layout() {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarDesktop />
      <SidebarMobile />

      <div className="md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-8">
          <h1 className="text-lg font-bold text-green-800 md:hidden">Farm Tracker</h1>
          <h1 className="hidden md:block text-lg font-bold text-green-800">Farm Tracker</h1>
          <button type="button" onClick={handleLogout} className="btn-secondary text-sm">
            Logout
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
