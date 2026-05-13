import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { OwnershipModule } from '@/pages/OwnershipModule'
import { ProcurementModule } from '@/pages/ProcurementModule'
import { HRDModule } from '@/pages/HRDModule'
import { EEModule } from '@/pages/EEModule'
import { MCDModule } from '@/pages/MCDModule'
import { HLCModule } from '@/pages/HLCModule'
import { SEDModule } from '@/pages/SEDModule'
import { SubmissionEngine } from '@/pages/SubmissionEngine'
import { AuditTrail } from '@/pages/AuditTrail'
import { UserManagement } from '@/pages/UserManagement'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-2xl text-white mb-3">NotoCharter™</div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="animate-spin text-brand-400">⟳</span> Loading…
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ownership"   element={<OwnershipModule />} />
          <Route path="procurement" element={<ProcurementModule />} />
          <Route path="hrd"         element={<HRDModule />} />
          <Route path="ee"          element={<EEModule />} />
          <Route path="mcd"         element={<MCDModule />} />
          <Route path="hlc"         element={<HLCModule />} />
          <Route path="sed"         element={<SEDModule />} />
          <Route path="submission"  element={<SubmissionEngine />} />
          <Route path="audit"       element={<AuditTrail />} />
          <Route path="users"       element={<UserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
