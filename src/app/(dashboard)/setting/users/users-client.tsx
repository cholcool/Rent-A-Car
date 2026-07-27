'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge, Button, Card, CardContent, Input, Label, Textarea } from '@/components/ui'
import { cn, formatePhoneNumber } from '@/lib/utils'
import { Plus, ShieldCheck, UserPlus, PenLine, X } from 'lucide-react'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'

export type UserRow = {
  id: string
  user_name: string
  user_email: string
  user_first_name: string
  user_last_name: string
  user_phone: string
  user_remark: string
  role_ids: string[]
  role_names: string[]
}

export type RoleRow = {
  id: string
  role_name: string
  role_code: string
  role_desc: string
  role_remark: string
  is_active: boolean
}

export type PermissionRow = {
  id: string
  permission_name: string
  permission_code: string
  permission_desc: string
  permission_remark: string
}

type UserForm = {
  user_name: string
  user_email: string
  user_password: string
  user_first_name: string
  user_last_name: string
  user_phone: string
  user_remark: string
  role_ids: string[]
}

type RoleForm = {
  kind: 'role' | 'permission'
  role_name: string
  role_code: string
  role_desc: string
  role_remark: string
  is_active: boolean
  permission_name: string
  permission_code: string
  permission_desc: string
  permission_remark: string
}

const emptyUserForm: UserForm = {
  user_name: '',
  user_email: '',
  user_password: '',
  user_first_name: '',
  user_last_name: '',
  user_phone: '',
  user_remark: '',
  role_ids: [],
}

const emptyRoleForm: RoleForm = {
  kind: 'role',
  role_name: '',
  role_code: '',
  role_desc: '',
  role_remark: '',
  is_active: true,
  permission_name: '',
  permission_code: '',
  permission_desc: '',
  permission_remark: '',
}

export default function UsersPageClient({
  initialUsers,
  initialRoles,
  initialPermissions,
}: {
  initialUsers: UserRow[]
  initialRoles: RoleRow[]
  initialPermissions: PermissionRow[]
}) {
  const [tab, setTab] = useState<'users' | 'roles'>('users')
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerReady, setDrawerReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingKind, setEditingKind] = useState<'user' | 'role' | 'permission' | null>(null)
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm)
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm)
  const [users, setUsers] = useState(initialUsers)
  const [roles, setRoles] = useState(initialRoles)
  const [permissions, setPermissions] = useState(initialPermissions)

  const roleMap = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!drawerOpen) {
      setDrawerReady(false)
      return
    }
    const timer = window.setTimeout(() => setDrawerReady(true), 20)
    return () => window.clearTimeout(timer)
  }, [drawerOpen])
  
  function openUserCreate() {
    setTab('users')
    setEditingId(null)
    setEditingKind(null)
    setUserForm(emptyUserForm)
    setError('')
    setMenuOpen(false)
    setDrawerOpen(true)
  }

  function openRoleCreate(kind: 'role' | 'permission') {
    setTab('roles')
    setEditingId(null)
    setEditingKind(kind)
    setRoleForm({ ...emptyRoleForm, kind })
    setError('')
    setMenuOpen(false)
    setDrawerOpen(true)
  }

  function openUserEdit(user: UserRow) {
    setTab('users')
    setEditingId(user.id)
    setEditingKind('user')
    setUserForm({
      user_name: user.user_name,
      user_email: user.user_email,
      user_password: '',
      user_first_name: user.user_first_name,
      user_last_name: user.user_last_name,
      user_phone: user.user_phone,
      user_remark: user.user_remark,
      role_ids: user.role_ids,
    })
    setError('')
    setDrawerOpen(true)
  }

  function openRoleEdit(kind: 'role' | 'permission', item: RoleRow | PermissionRow) {
    setTab('roles')
    setEditingId(item.id)
    setEditingKind(kind)
    if (kind === 'role') {
      const role = item as RoleRow
      setRoleForm({
        kind,
        role_name: role.role_name,
        role_code: role.role_code,
        role_desc: role.role_desc,
        role_remark: role.role_remark,
        is_active: role.is_active,
        permission_name: '',
        permission_code: '',
        permission_desc: '',
        permission_remark: '',
      })
    } else {
      const permission = item as PermissionRow
      setRoleForm({
        ...emptyRoleForm,
        kind,
        permission_name: permission.permission_name,
        permission_code: permission.permission_code,
        permission_desc: permission.permission_desc,
        permission_remark: permission.permission_remark,
      })
    }
    setError('')
    setDrawerOpen(true)
  }

  function closeDrawer() {
    if (busy) return
    setDrawerOpen(false)
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!userForm.user_name.trim() || !userForm.user_email.trim() || !userForm.user_first_name.trim() || !userForm.user_last_name.trim() || !userForm.user_phone.trim()) {
      setError('กรุณากรอกข้อมูลบังคับให้ครบ')
      return
    }
    if (!editingId && !userForm.user_password.trim()) {
      setError('กรุณากรอกรหัสผ่าน')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/settings/users', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...userForm } : userForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'บันทึกไม่สำเร็จ')
        return
      }
      setUsers((current) => (editingId ? current.map((row) => (row.id === data.user.id ? data.user : row)) : [data.user, ...current]))
      setDrawerOpen(false)
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setBusy(false)
    }
  }

  async function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (roleForm.kind === 'role') {
      if (!roleForm.role_name.trim() || !roleForm.role_code.trim()) {
        setError('กรุณากรอกข้อมูลบทบาทให้ครบ')
        return
      }
    } else {
      if (!roleForm.permission_name.trim() || !roleForm.permission_code.trim()) {
        setError('กรุณากรอกข้อมูลสิทธิ์ให้ครบ')
        return
      }
    }

    setBusy(true)
    try {
      const endpoint = roleForm.kind === 'role' ? '/api/settings/roles' : '/api/settings/permissions'
      const res = await fetch(endpoint, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...roleForm } : roleForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'บันทึกไม่สำเร็จ')
        return
      }
      if (roleForm.kind === 'role') {
        setRoles((current) => (editingId ? current.map((row) => (row.id === data.role.id ? data.role : row)) : [data.role, ...current]))
      } else {
        setPermissions((current) => (editingId ? current.map((row) => (row.id === data.permission.id ? data.permission : row)) : [data.permission, ...current]))
      }
      setDrawerOpen(false)
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setBusy(false)
    }
  }

  async function deleteRow(kind: 'user' | 'role' | 'permission', id: string) {
    const endpoint = kind === 'user' ? '/api/settings/users' : kind === 'role' ? '/api/settings/roles' : '/api/settings/permissions'
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error ?? 'ลบข้อมูลไม่สำเร็จ')
      return
    }
    if (kind === 'user') setUsers((current) => current.filter((row) => row.id !== id))
    if (kind === 'role') setRoles((current) => current.filter((row) => row.id !== id))
    if (kind === 'permission') setPermissions((current) => current.filter((row) => row.id !== id))
  }

  const drawerTitle =
    tab === 'users'
      ? editingId
        ? 'แก้ไขผู้ใช้'
        : 'เพิ่มผู้ใช้'
      : editingKind === 'permission'
        ? 'เพิ่มสิทธิ์/บทบาท'
        : editingId
          ? 'แก้ไขสิทธิ์/บทบาท'
          : 'เพิ่มสิทธิ์/บทบาท'

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Setting</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">ผู้ใช้และสิทธิ์การใช้งาน</h1>
        <p className="max-w-3xl text-lg font-semibold text-slate-500">แบ่ง UI ชัดเจนระหว่างการจัดการผู้ใช้ และการจัดการบทบาท/สิทธิ์</p>
      </header>

      <div className='hidden'>
        <section className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">ผู้ใช้ทั้งหมด</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{users.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">บทบาททั้งหมด</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{roles.length}</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">สิทธิ์ทั้งหมด</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{permissions.length}</div></CardContent></Card>
        </section>
      </div>

      <div className='hidden'>
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button type="button" onClick={() => setTab('users')} className={cn('flex-1 rounded-xl px-4 py-3 text-sm font-bold transition', tab === 'users' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50')}>จัดการผู้ใช้</button>
          <button type="button" onClick={() => setTab('roles')} className={cn('flex-1 rounded-xl px-4 py-3 text-sm font-bold transition', tab === 'roles' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50')}>จัดการบทบาท/สิทธิ์</button>
        </div>
      </div>

      {tab === 'users' ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">รายการล่าสุด</h2>
              </div>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-275 text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                    <th className="px-3 py-3">ชื่อ</th>
                    <th className="px-3 py-3">Username</th>
                    <th className="px-3 py-3">อีเมล</th>
                    <th className="px-3 py-3">โทรศัพท์</th>
                    <th className="px-3 py-3">บทบาท</th>
                    <th className="px-3 py-3">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 text-sm font-medium text-slate-700">
                      <td className="px-3 py-4 font-bold text-slate-950">{`${user.user_first_name} ${user.user_last_name}`}</td>
                      <td className="px-3 py-4">{user.user_name}</td>
                      <td className="px-3 py-4">{user.user_email}</td>
                      <td className="px-3 py-4">{user.user_phone}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.role_ids.length ? user.role_ids.map((roleId) => <Badge key={roleId}>{roleMap.get(roleId)?.role_code ?? roleId}</Badge>) : <span className="text-sm font-semibold text-slate-400">ยังไม่มีบทบาท</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openUserEdit(user)}>
                            <PenLine className="h-4 w-4" />
                            แก้ไข
                          </Button>
                          <AlertDialogDestructive onClick={() => deleteRow('user', user.id)} variant={'destructive'} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">ระบบจัดการบทบาทและสิทธิ์</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">แยกตารางบทบาทและสิทธิ์ออกจากกันชัดเจน</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-extrabold text-slate-950">บทบาท</h3>
                  <Button type="button" className="gap-2" onClick={() => openRoleCreate('role')}>
                    <Plus className="h-4 w-4" />
                    เพิ่มสิทธิ์/บทบาท
                  </Button>
                </div>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                      <div>
                        <div className="font-bold text-slate-950">{role.role_name}</div>
                        <div className="text-sm text-slate-500">{role.role_code}</div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant={role.is_active ? 'success' : 'destructive'}>{role.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openRoleEdit('role', role)}>
                          แก้ไข
                        </Button>
                        <AlertDialogDestructive onClick={() => deleteRow('user', role.id)} variant={'destructive'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-extrabold text-slate-950">สิทธิ์</h3>
                  <Button type="button" className="gap-2" onClick={() => openRoleCreate('permission')}>
                    <Plus className="h-4 w-4" />
                    เพิ่มสิทธิ์/บทบาท
                  </Button>
                </div>
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                      <div>
                        <div className="font-bold text-slate-950">{permission.permission_name || permission.permission_code}</div>
                        <div className="text-sm text-slate-500">{permission.permission_code}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openRoleEdit('permission', permission)}>
                          แก้ไข
                        </Button>
                        <AlertDialogDestructive onClick={() => deleteRow('user', permission.id)} variant={'destructive'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-3">
        {menuOpen ? (
          <button
            type="button"
            onClick={openUserCreate}
            className={cn(
              'group flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10 transition-all duration-200',
              'min-w-52 max-w-60',
              'border-slate-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50'
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shadow-sm transition group-hover:bg-white group-hover:text-violet-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">เพิ่มผู้ใช้</div>
              <div className="truncate text-xs font-medium text-slate-500">เปิด drawer สำหรับสร้างผู้ใช้ใหม่</div>
            </div>
          </button>
        ) : null}

        <Button
          type="button"
          size="lg"
          onClick={() => setMenuOpen((value) => !value)}
          className={cn('h-14 w-14 rounded-xl border-2 border-violet-200 bg-violet-600 shadow-2xl shadow-violet-900/25', 'hover:bg-violet-700')}
        >
          {menuOpen ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
        </Button>
      </div>

      {drawerOpen && drawerReady ? (
        <>
          <button type="button" aria-label="Close drawer" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px]" onClick={closeDrawer} />
          <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <Card className="h-full rounded-none border-0">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950">{drawerTitle}</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">ฟอร์มจะเรนเดอร์ตอน drawer เปิดสำเร็จแล้วเท่านั้น</p>
                  </div>
                  <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {error ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

                {tab === 'users' ? (
                  <form className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1" onSubmit={submitUser}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="user_name">ชื่อผู้ใช้สำหรับเข้าระบบ *</Label>
                        <Input id="user_name" maxLength={150} value={userForm.user_name} onChange={(e) => setUserForm((current) => ({ ...current, user_name: e.target.value }))} required />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="user_email">อีเมล *</Label>
                        <Input id="user_email" type="email" maxLength={150} value={userForm.user_email} onChange={(e) => setUserForm((current) => ({ ...current, user_email: e.target.value }))} required />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="user_password">{editingId ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน *'}</Label>
                        <Input id="user_password" type="password" maxLength={150} value={userForm.user_password} onChange={(e) => setUserForm((current) => ({ ...current, user_password: e.target.value }))} required={!editingId} />
                      </div>
                      <div>
                        <Label htmlFor="user_first_name">ชื่อจริง *</Label>
                        <Input id="user_first_name" maxLength={150} value={userForm.user_first_name} onChange={(e) => setUserForm((current) => ({ ...current, user_first_name: e.target.value }))} required />
                      </div>
                      <div>
                        <Label htmlFor="user_last_name">นามสกุล *</Label>
                        <Input id="user_last_name" maxLength={150} value={userForm.user_last_name} onChange={(e) => setUserForm((current) => ({ ...current, user_last_name: e.target.value }))} required />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="user_phone">เบอร์โทรศัพท์ *</Label>
                        <Input id="user_phone" maxLength={10} minLength={10} value={userForm.user_phone} onChange={(e) => setUserForm((current) => ({ ...current, user_phone: formatePhoneNumber(e.target.value) }))} required />
                      </div>
                      <div className="md:col-span-2">
                        <Label>บทบาท</Label>
                        <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 p-4">
                          {roles.map((role) => (
                            <label key={role.id} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                              <input
                                type="checkbox"
                                checked={userForm.role_ids.includes(role.id)}
                                onChange={(e) =>
                                  setUserForm((current) => ({
                                    ...current,
                                    role_ids: e.target.checked
                                      ? [...current.role_ids, role.id]
                                      : current.role_ids.filter((roleId) => roleId !== role.id),
                                  }))
                                }
                              />
                              {role.role_name} ({role.role_code})
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="user_remark">หมายเหตุ</Label>
                        <Textarea id="user_remark" maxLength={500} value={userForm.user_remark} onChange={(e) => setUserForm((current) => ({ ...current, user_remark: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                      <Button type="button" variant="outline" onClick={closeDrawer}>
                        ปิด
                      </Button>
                      <Button type="submit" disabled={busy} className="gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        {busy ? 'กำลังบันทึก...' : 'บันทึกผู้ใช้'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1" onSubmit={submitRole}>
                    <div className="flex gap-2 rounded-2xl border border-slate-200 p-2">
                      <button type="button" onClick={() => setRoleForm((current) => ({ ...current, kind: 'role' }))} className={cn('flex-1 rounded-xl px-4 py-3 text-sm font-bold transition', roleForm.kind === 'role' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50')}>
                        บทบาท
                      </button>
                      <button type="button" onClick={() => setRoleForm((current) => ({ ...current, kind: 'permission' }))} className={cn('flex-1 rounded-xl px-4 py-3 text-sm font-bold transition', roleForm.kind === 'permission' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50')}>
                        สิทธิ์
                      </button>
                    </div>

                    {roleForm.kind === 'role' ? (
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label htmlFor="role_name">ชื่อบทบาท *</Label>
                          <Input id="role_name" maxLength={100} value={roleForm.role_name} onChange={(e) => setRoleForm((current) => ({ ...current, role_name: e.target.value }))} required />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="role_code">รหัสบทบาท *</Label>
                          <Input id="role_code" maxLength={50} value={roleForm.role_code} onChange={(e) => setRoleForm((current) => ({ ...current, role_code: e.target.value }))} required />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="role_desc">คำอธิบายบทบาท</Label>
                          <Input id="role_desc" maxLength={255} value={roleForm.role_desc} onChange={(e) => setRoleForm((current) => ({ ...current, role_desc: e.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="role_remark">หมายเหตุบทบาท</Label>
                          <Textarea id="role_remark" maxLength={500} value={roleForm.role_remark} onChange={(e) => setRoleForm((current) => ({ ...current, role_remark: e.target.value }))} />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                          <div>
                            <div className="text-sm font-bold text-slate-950">เปิดใช้งานบทบาท</div>
                            <div className="text-xs font-medium text-slate-500">ค่าเริ่มต้น TRUE</div>
                          </div>
                          <input type="checkbox" checked={roleForm.is_active} onChange={(e) => setRoleForm((current) => ({ ...current, is_active: e.target.checked }))} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label htmlFor="permission_name">ชื่อสิทธิ์ *</Label>
                          <Input id="permission_name" maxLength={100} value={roleForm.permission_name} onChange={(e) => setRoleForm((current) => ({ ...current, permission_name: e.target.value }))} required />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="permission_code">รหัสสิทธิ์ *</Label>
                          <Input id="permission_code" maxLength={100} value={roleForm.permission_code} onChange={(e) => setRoleForm((current) => ({ ...current, permission_code: e.target.value }))} required />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="permission_desc">คำอธิบายสิทธิ์</Label>
                          <Input id="permission_desc" maxLength={255} value={roleForm.permission_desc} onChange={(e) => setRoleForm((current) => ({ ...current, permission_desc: e.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="permission_remark">หมายเหตุสิทธิ์</Label>
                          <Textarea id="permission_remark" maxLength={500} value={roleForm.permission_remark} onChange={(e) => setRoleForm((current) => ({ ...current, permission_remark: e.target.value }))} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                      <Button type="button" variant="outline" onClick={closeDrawer}>
                        ปิด
                      </Button>
                      <Button type="submit" disabled={busy} className="gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        {busy ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </aside>
        </>
      ) : null}
    </div>
  )
}
