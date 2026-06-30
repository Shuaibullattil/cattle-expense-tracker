import { NavLink } from 'react-router-dom'
import { APP_ICON, NAV_ITEMS } from '../constants/selectOptions'
import { HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2'

const SIDEBAR_ITEMS = NAV_ITEMS.filter((item) =>
  ['Dashboard', 'Animals', 'Events', 'Expenses', 'Income', 'Milking', 'Reports'].includes(item.label)
)

function NavItem({ to, label, Icon, end, showLabel }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
          showLabel ? 'gap-3 px-3' : 'justify-center px-0'
        } ${
          isActive
            ? 'bg-green-700 text-white'
            : 'text-green-100 hover:bg-green-800 hover:text-white'
        }`
      }
    >
      <Icon className="shrink-0 text-lg" aria-hidden />
      {showLabel && <span className="truncate">{label}</span>}
      {!showLabel && (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar({ sidebarState, toggleSidebar, closeSidebar, onLogout }) {
  const Logo = APP_ICON
  const isFull = sidebarState === 'full'
  const showLabel = isFull

  return (
    <>
      <header className="fixed left-0 top-0 z-40 flex h-12 w-full items-center border-b border-gray-200 bg-white/95 px-3 shadow-sm backdrop-blur md:hidden">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-green-900 hover:bg-green-50"
          aria-label={isFull ? 'Close sidebar' : 'Open sidebar'}
        >
          {isFull ? <HiOutlineXMark size={24} aria-hidden /> : <HiOutlineBars3 size={24} aria-hidden />}
        </button>
      </header>

      <button
        type="button"
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-200 lg:hidden ${
          isFull ? 'opacity-50' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Close sidebar"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-green-900 transition-all duration-300 ease-in-out ${
          isFull ? 'w-64 translate-x-0' : sidebarState === 'icons' ? 'w-14 translate-x-0' : 'w-64 -translate-x-full'
        }`}
      >
        <div className={`flex h-14 items-center border-b border-green-800 ${showLabel ? 'gap-2 px-4' : 'justify-center px-2'}`}>
          {showLabel ? (
            <Logo className="text-2xl text-white shrink-0" aria-hidden />
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-green-800"
              aria-label="Expand sidebar"
            >
              <Logo className="text-2xl shrink-0" aria-hidden />
            </button>
          )}
          {showLabel && <span className="text-lg font-bold text-white truncate">Farm Tracker</span>}
          {showLabel && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="ml-auto hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-green-100 hover:bg-green-800 hover:text-white md:flex"
              aria-label="Collapse sidebar"
            >
              <HiOutlineBars3 size={22} aria-hidden />
            </button>
          )}
        </div>

        <nav className={`flex-1 space-y-0.5 overflow-y-auto ${showLabel ? 'p-3' : 'px-2 py-3'}`} aria-label="Main navigation">
          {SIDEBAR_ITEMS.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              label={link.label}
              Icon={link.Icon}
              end={link.to === '/dashboard'}
              showLabel={showLabel}
            />
          ))}
        </nav>

        <div className={`border-t border-green-800 ${showLabel ? 'p-3' : 'px-2 py-3'}`}>
          <button
            type="button"
            onClick={onLogout}
            className={`group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-green-100 transition-colors hover:bg-green-800 hover:text-white ${
              showLabel ? 'gap-3 px-3' : 'justify-center px-0'
            }`}
          >
            <HiOutlineArrowRightOnRectangle className="shrink-0 text-lg" aria-hidden />
            {showLabel && <span className="truncate">Logout</span>}
            {!showLabel && (
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
