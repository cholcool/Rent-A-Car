'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import Textarea from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PenLine, Trash2, X } from 'lucide-react'

export type PermissionRow = { id: string; permission_name: string; permission_code: string; permission_desc: string; permission_remark: string }
export type MenuRow = { id: string; menu_key: string; menu_title: string }

type FormState = PermissionRow & { menu_id: string; role_id: string }

const emptyForm: FormState = { id: '', permission_name: '', permission_code: '', permission_desc: '', permission_remark: '', menu_id: '', role_id: '' }

export default function PermissionsPageClient({ initialPermissions, initialMenus }: { initialPermissions: PermissionRow[]; initialMenus: MenuRow[] }) {
  const [permissions, setPermissions] = useState(initialPermissions)
  const [menus] = useState(initialMenus)
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

  function openCreate() { setEditingId(''); setForm(emptyForm); setError(''); setDrawerOpen(true) }
  function openEdit(item: PermissionRow) {
    setEditingId(item.id)
    setForm({
      id: '',
      permission_name: item.permission_name,
      permission_code: item.permission_code,
      permission_desc: item.permission_desc,
      permission_remark: item.permission_remark,
      menu_id: '',
      role_id: '',
    })
    setError('')
    setDrawerOpen(true)
  }
  function closeDrawer() { if (!busy) setDrawerOpen(false) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.permission_name.trim() || !form.permission_code.trim()) return setError('กรุณากรอกข้อมูลบังคับให้ครบ')
    setBusy(true)
    try {
      const payload = {
        permission_name: form.permission_name,
        permission_code: form.permission_code,
        permission_desc: form.permission_desc,
        permission_remark: form.permission_remark,
        menu_id: form.menu_id,
        role_id: form.role_id,
      }
      const res = await fetch('/api/settings/permissions', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) })
      const data = await res.json()
      if (!res.ok) return setError(data?.error ?? 'บันทึกไม่สำเร็จ')
      setPermissions((current) => editingId ? current.map((row) => (row.id === data.permission.id ? data.permission : row)) : [data.permission, ...current])
      setDrawerOpen(false)
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    const res = await fetch('/api/settings/permissions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await res.json()
    if (!res.ok) return setError(data?.error ?? 'ลบไม่สำเร็จ')
    setPermissions((current) => current.filter((row) => row.id !== id))
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Setting</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">สิทธิ์และการผูกกับเมนู</h1>
      </header>
      <Card><CardContent className="p-6 sm:p-8">
        {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        <div className="space-y-3">
          {permissions.map((permission) => <div key={permission.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><div className="font-bold">{permission.permission_name || permission.permission_code}</div><div className="text-sm text-slate-500">{permission.permission_code}</div></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openEdit(permission)} className="gap-2"><PenLine className="h-4 w-4" />แก้ไข</Button><AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" />ลบ</Button></AlertDialogTrigger><AlertDialogContent size="sm"><AlertDialogHeader><AlertDialogTitle>ลบสิทธิ์?</AlertDialogTitle><AlertDialogDescription>Soft delete สิทธิ์นี้</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove(permission.id)}>ลบข้อมูล</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>)}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-950">เมนูในระบบ</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {menus.map((menu) => <span key={menu.id} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-700">{menu.menu_title}</span>)}
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-40">
          <Button type="button" size="lg" onClick={openCreate} className="h-14 rounded-xl bg-violet-600 px-5">+ เพิ่มสิทธิ์</Button>
        </div>
      </CardContent></Card>
      {drawerOpen && drawerReady ? <div className="fixed inset-0 z-30 bg-black/30"><aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-extrabold">{editingId ? 'แก้ไขสิทธิ์' : 'เพิ่มสิทธิ์'}</h2><button onClick={closeDrawer}><X /></button></div><form onSubmit={submit} className="mt-6 space-y-5"><div><Label>ชื่อสิทธิ์ *</Label><Input value={form.permission_name} onChange={(e) => setForm((c) => ({ ...c, permission_name: e.target.value }))} required /></div><div><Label>รหัสสิทธิ์ *</Label><Input value={form.permission_code} onChange={(e) => setForm((c) => ({ ...c, permission_code: e.target.value }))} required /></div><div><Label>คำอธิบาย</Label><Input value={form.permission_desc} onChange={(e) => setForm((c) => ({ ...c, permission_desc: e.target.value }))} /></div><div><Label>หมายเหตุ</Label><Textarea value={form.permission_remark} onChange={(e) => setForm((c) => ({ ...c, permission_remark: e.target.value }))} /></div><div><Label>เมนู</Label><select className="mt-2 w-full rounded-xl border p-3"><option>ผูกภายหลัง</option>{menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.menu_title}</option>)}</select></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={closeDrawer}>ปิด</Button><Button type="submit" disabled={busy}>บันทึก</Button></div></form></aside></div> : null}
    </div>
  )
}
