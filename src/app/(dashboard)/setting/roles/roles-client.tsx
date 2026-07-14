'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Card, CardContent, Input, Label, Textarea, Badge, Button } from '@/components/ui'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PenLine, Trash2, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RoleRow = { id: string; role_name: string; role_code: string; role_desc: string; role_remark: string; is_active: boolean }

type FormState = RoleRow

const emptyForm: FormState = { id: '', role_name: '', role_code: '', role_desc: '', role_remark: '', is_active: true }

export default function RolesPageClient({ initialRoles }: { initialRoles: RoleRow[] }) {
  const [roles, setRoles] = useState(initialRoles)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerReady, setDrawerReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!drawerOpen) return setDrawerReady(false)
    const t = setTimeout(() => setDrawerReady(true), 20)
    return () => clearTimeout(t)
  }, [drawerOpen])

  function openCreate() { setEditingId(''); setForm(emptyForm); setError(''); setDrawerOpen(true); setMenuOpen(false) }
  function openEdit(role: RoleRow) {
    setEditingId(role.id)
    setForm({
      id: '',
      role_name: role.role_name,
      role_code: role.role_code,
      role_desc: role.role_desc,
      role_remark: role.role_remark,
      is_active: role.is_active,
    })
    setError('')
    setDrawerOpen(true)
  }
  function closeDrawer() { if (!busy) setDrawerOpen(false) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.role_name.trim() || !form.role_code.trim()) return setError('กรุณากรอกข้อมูลบังคับให้ครบ')
    setBusy(true)
    try {
      const payload = {
        role_name: form.role_name,
        role_code: form.role_code,
        role_desc: form.role_desc,
        role_remark: form.role_remark,
        is_active: form.is_active,
      }
      const res = await fetch('/api/settings/roles', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) })
      const data = await res.json()
      if (!res.ok) return setError(data?.error ?? 'บันทึกไม่สำเร็จ')
      setRoles((current) => editingId ? current.map((row) => (row.id === data.role.id ? data.role : row)) : [data.role, ...current])
      setDrawerOpen(false)
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    const res = await fetch('/api/settings/roles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await res.json()
    if (!res.ok) return setError(data?.error ?? 'ลบไม่สำเร็จ')
    setRoles((current) => current.filter((row) => row.id !== id))
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Setting</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">บทบาทผู้ใช้</h1>
      </header>
      <Card><CardContent className="p-6 sm:p-8">
        {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        <div className="space-y-3">
          {roles.map((role) => <div key={role.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><div className="font-bold">{role.role_name}</div><div className="text-sm text-slate-500">{role.role_code}</div><Badge variant={role.is_active ? 'success' : 'destructive'} className="mt-2">{role.is_active ? 'Active' : 'Inactive'}</Badge></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openEdit(role)} className="gap-2"><PenLine className="h-4 w-4" />แก้ไข</Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" />ลบ</Button></AlertDialogTrigger><AlertDialogContent size="sm"><AlertDialogHeader><AlertDialogTitle>ลบบทบาท?</AlertDialogTitle><AlertDialogDescription>Soft delete บทบาทนี้</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove(role.id)}>ลบข้อมูล</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>)}
        </div>
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {menuOpen ? <button type="button" onClick={openCreate} className={cn('group flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 shadow-lg shadow-slate-950/10','min-w-52 max-w-60','border-slate-200')}><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50"><Plus className="h-5 w-5" /></div><div><div className="text-sm font-bold">เพิ่มบทบาท</div></div></button> : null}
          <Button type="button" size="lg" onClick={() => setMenuOpen((v) => !v)} className="h-14 w-14 rounded-xl bg-violet-600">{menuOpen ? '×' : '+'}</Button>
        </div>
      </CardContent></Card>
      {drawerOpen && drawerReady ? <div className="fixed inset-0 z-30 bg-black/30"><aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-extrabold">{editingId ? 'แก้ไขบทบาท' : 'เพิ่มบทบาท'}</h2><button onClick={closeDrawer}><X /></button></div><form onSubmit={submit} className="mt-6 space-y-5"><div><Label>ชื่อบทบาท *</Label><Input value={form.role_name} onChange={(e) => setForm((c) => ({ ...c, role_name: e.target.value }))} required /></div><div><Label>รหัสบทบาท *</Label><Input value={form.role_code} onChange={(e) => setForm((c) => ({ ...c, role_code: e.target.value }))} required /></div><div><Label>คำอธิบาย</Label><Input value={form.role_desc} onChange={(e) => setForm((c) => ({ ...c, role_desc: e.target.value }))} /></div><div><Label>หมายเหตุ</Label><Textarea value={form.role_remark} onChange={(e) => setForm((c) => ({ ...c, role_remark: e.target.value }))} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={closeDrawer}>ปิด</Button><Button type="submit" disabled={busy}>บันทึก</Button></div></form></aside></div> : null}
    </div>
  )
}
