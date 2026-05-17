import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import type { UserRole } from '@/types'

interface NavItem {
  path: string
  label: string
  icon: string
  dmrRef: string
  roles: UserRole[]
}

const NAV: NavItem[] = [
  { path: '/',            label: 'Dashboard',           icon: '◉', dmrRef: 'Scorecard',  roles: ['compliance_officer','executive','auditor','hr_manager','procurement_lead','slp_coordinator'] },
  { path: '/ownership',   label: 'Ownership',           icon: '⬡', dmrRef: 'Tables A–G', roles: ['compliance_officer','auditor'] },
  { path: '/procurement', label: 'Procurement',         icon: '⬢', dmrRef: 'Tables H–M', roles: ['compliance_officer','procurement_lead','auditor'] },
  { path: '/hrd',         label: 'HR Development',      icon: '◈', dmrRef: 'Tables Q–R', roles: ['compliance_officer','hr_manager','auditor'] },
  { path: '/ee',          label: 'Employment Equity',   icon: '◇', dmrRef: 'Tables T–V', roles: ['compliance_officer','hr_manager','auditor'] },
  { path: '/mcd',         label: 'Mine Community Dev',  icon: '◆', dmrRef: 'Table S',    roles: ['compliance_officer','slp_coordinator','auditor'] },
  { path: '/hlc',         label: 'Housing & Living',    icon: '⬟', dmrRef: 'Table W',    roles: ['compliance_officer','auditor'] },
  { path: '/sed',         label: 'SED',                 icon: '○', dmrRef: 'Table X',    roles: ['compliance_officer','auditor'] },
  { path: '/submission',  label: 'Submission Engine',   icon: '↗', dmrRef: 'Export',     roles: ['compliance_officer'] },
  { path: '/audit',       label: 'Audit Trail',         icon: '≡', dmrRef: 'Log',        roles: ['compliance_officer','auditor'] },
  { path: '/users',       label: 'User Management',     icon: '⊕', dmrRef: 'Admin',      roles: ['compliance_officer'] },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { online } = useNetworkStatus()

  const visibleNav = NAV.filter(n => !user || n.roles.includes(user.role))

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-w-[240px] bg-ink flex flex-col overflow-y-auto">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-ink-3">
        <div className="font-display text-xl text-white leading-tight">NotoCharter™</div>
        <div className="text-[10px] text-ink-muted font-mono uppercase tracking-widest mt-1">
          MC III Compliance
        </div>
        <div className="text-[9px] text-ink-muted mt-2 font-mono">
          Kwahlelwa Group · NPC-Cimpor
        </div>
        {!online && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-amber-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Offline — cached data
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3">
        {visibleNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 group',
              isActive
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-ink-3',
            )}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1 text-[13px]">{item.label}</span>
            <span className={cn(
              'text-[9px] font-mono',
              'opacity-0 group-hover:opacity-60 transition-opacity',
            )}>
              {item.dmrRef}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-4 py-4 border-t border-ink-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
              <div className="text-[10px] text-ink-muted font-mono capitalize">
                {user.role.replace(/_/g, ' ')}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-ink-muted hover:text-white transition-colors text-sm"
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
