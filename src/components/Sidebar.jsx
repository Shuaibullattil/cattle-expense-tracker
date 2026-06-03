import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/animals', label: 'Animals', icon: '🐄' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/income', label: 'Income', icon: '💰' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

function NavItem({ to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-green-700 text-white'
            : 'text-green-100 hover:bg-green-800 hover:text-white'
        }`
      }
    >
      <span className="text-lg" aria-hidden="true">{icon}</span>
      {label}
    </NavLink>
  )
}

export function SidebarDesktop() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-green-900">
      <div className="flex h-16 items-center px-6 border-b border-green-800">
        <span className="text-xl font-bold text-white">🌾 Farm Tracker</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.to === '/dashboard'} />
        ))}
      </nav>
    </aside>
  )
}

export function SidebarMobile() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-green-800 bg-green-900 px-2 py-2 safe-area-pb">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium ${
              isActive ? 'text-white' : 'text-green-300'
            }`
          }
        >
          <span className="text-lg" aria-hidden="true">{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
