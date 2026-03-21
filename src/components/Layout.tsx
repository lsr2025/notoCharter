import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DEMO_MODE } from '@/lib/supabase'

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {DEMO_MODE && (
        <div className="bg-ringfenced text-white text-xs font-mono text-center py-1.5 px-4 flex-shrink-0 flex items-center justify-center gap-2">
          <span>⚠</span>
          <span>DEMO MODE — Sample data for NPC-Cimpor presentation · Not connected to live database · Kwahlelwa Group Confidential</span>
          <span>⚠</span>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
