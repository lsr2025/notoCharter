import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PageHeader } from '../components/PageHeader'
import { Card, CardHeader, CardBody } from '../components/Card'
import { Button } from '../components/Button'
import type { UserRole } from '../types'

interface UserProfile {
  id: string
  email: string
  role: UserRole
  is_active: boolean
  mining_right_ids: string[]
}

const ROLES: UserRole[] = [
  'compliance_officer', 'hr_manager', 'procurement_lead',
  'slp_coordinator', 'executive', 'auditor',
]

async function callUserMgmt(body: object, accessToken: string) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('executive')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function loadUsers() {
    const { data } = await supabase.from('user_profiles').select('*').order('email')
    setUsers((data ?? []) as UserProfile[])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const token = await getToken()
      await callUserMgmt({ action: 'invite', email: inviteEmail, role: inviteRole, mining_right_ids: [] }, token)
      setSuccessMsg(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm('Revoke this user\'s access?')) return
    const token = await getToken()
    await callUserMgmt({ action: 'revoke', user_id: userId }, token)
    await loadUsers()
  }

  if (!user || user.role !== 'compliance_officer') {
    return <div className="p-6 text-red-600">Access denied. Compliance officers only.</div>
  }

  if (loading) return <div className="p-6">Loading users…</div>

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="User Management"
        subtitle="Invite users, assign roles, and manage access to NotoCharter™"
        dmrRef="Admin"
      />

      <div className="p-8 space-y-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-ink">Invite New User</h3>
          </CardHeader>
          <CardBody>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            {successMsg && <p className="mb-3 text-sm text-green-600">{successMsg}</p>}
            <form onSubmit={handleInvite} className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-ink-muted mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@npc-cimpor.co.za"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" loading={busy} variant="primary" size="md">
                {busy ? 'Sending…' : 'Send Invite'}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-ink">Users ({users.length})</h3>
          </CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-ink-muted">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-ink-muted">Role</th>
                  <th className="px-6 py-3 text-xs font-medium text-ink-muted">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3">{u.email}</td>
                    <td className="px-6 py-3 capitalize">{u.role.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {u.is_active && u.id !== user.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevoke(u.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-ink-muted text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
