import { NavLink } from 'react-router-dom'
import { APP_ICON, NAV_ITEMS } from '../constants/selectOptions'

function NavItem({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-green-700 text-white'
            : 'text-green-100 hover:bg-green-800 hover:text-white'
        }`
      }
    >
      <Icon className="shrink-0 text-lg" aria-hidden />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function SidebarDesktop() {
  const Logo = APP_ICON
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 md:flex-col md:fixed md:inset-y-0 bg-green-900">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-green-800">
        <Logo className="text-2xl text-white shrink-0" aria-hidden />
        <span className="text-lg font-bold text-white truncate">Farm Tracker</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {NAV_ITEMS.map((link) => (
          <NavItem
            key={link.to}
            to={link.to}
            label={link.label}
            Icon={link.Icon}
            end={link.to === '/dashboard'}
          />
        ))}
      </nav>
    </aside>
  )
}

export function SidebarMobile() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-green-800 bg-green-900 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((link) => {
        const Icon = link.Icon
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-0.5 rounded-lg text-[10px] font-medium ${
                isActive ? 'text-white bg-green-800' : 'text-green-300'
              }`
            }
          >
            <Icon className="text-xl shrink-0" aria-hidden />
            <span className="truncate max-w-full">{link.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
