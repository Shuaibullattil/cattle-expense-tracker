import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context'
import { APP_ICON } from '../constants/selectOptions'
import { SidebarDesktop, SidebarMobile } from './Sidebar'

export default function Layout() {
  const { signOut } = useAuth()
  const Logo = APP_ICON

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarDesktop />
      <SidebarMobile />

      <div className="md:pl-60 lg:pl-64 flex flex-col min-h-screen pb-[4.5rem] md:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Logo className="text-xl text-green-700 shrink-0 md:hidden" aria-hidden />
            <h1 className="text-base sm:text-lg font-bold text-green-800 truncate">Farm Tracker</h1>
          </div>
          <button type="button" onClick={() => signOut()} className="btn-secondary text-sm !min-h-[40px] !py-2 !px-3">
            <HiOutlineArrowRightOnRectangle size={18} aria-hidden />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </header>

        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
