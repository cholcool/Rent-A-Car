'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, CardContent, Input, Label, Textarea, Switch } from '@/components/ui'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PenLine, Trash2, X } from 'lucide-react'
import { getMenuIconComponent } from '@/lib/rbac/menus'

export type MenuRow = {
  id: string
  key: string
  title: string
  icon: string
  path: string
  parentId: string | null
  sequence: number
  remark: string
  requiredPermission: string
  isActive: boolean
  isExternal: boolean
}

type MenuOption = { id: string; label: string }

type FormState = Omit<MenuRow, 'id'> & { id: string }

const emptyForm: FormState = {
  id: '',
  key: '',
  title: '',
  icon: 'Settings',
  path: '',
  parentId: '',
  sequence: 0,
  remark: '',
  requiredPermission: '',
  isActive: true,
  isExternal: false,
}

export default function MenuPageClient({
  initialMenus,
  initialMenuOptions,
  initialPermissionOptions,
}: {
  initialMenus: MenuRow[]
  initialMenuOptions: MenuOption[]
  initialPermissionOptions: MenuOption[]
}) {
  const [menus, setMenus] = useState(initialMenus)
  const [menuOptions, setMenuOptions] = useState(initialMenuOptions)
  const [permissionOptions] = useState(initialPermissionOptions)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerReady, setDrawerReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!drawerOpen) return setDrawerReady(false)
    const timer = setTimeout(() => setDrawerReady(true), 20)
    return () => clearTimeout(timer)
  }, [drawerOpen])

  useEffect(() => {
    setMenuOptions(menus.map((menu) => ({ id: menu.id, label: `${menu.title} (${menu.key})` })))
  }, [menus])

  function openCreate() {
    setEditingId('')
    setForm(emptyForm)
    setError('')
    setDrawerOpen(true)
  }

  function openEdit(item: MenuRow) {
    setEditingId(item.id)
    setForm({ ...item })
    setError('')
    setDrawerOpen(true)
  }

  function closeDrawer() {
    if (!busy) setDrawerOpen(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.key.trim() || !form.title.trim() || !form.path.trim()) {
      setError('กรุณากรอกข้อมูลบังคับให้ครบ')
      return
    }

    setBusy(true)
    try {
      const payload = {
        key: form.key,
        title: form.title,
        icon: form.icon,
        path: form.path,
        parentId: form.parentId,
        sequence: form.sequence,
        remark: form.remark,
        requiredPermission: form.requiredPermission,
        isActive: form.isActive,
        isExternal: form.isExternal,
      }
      const res = await fetch('/api/settings/menus', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })
      const data = await res.json()
      if (!res.ok) return setError(data?.error ?? 'บันทึกไม่สำเร็จ')

      setMenus((current) =>
        editingId ? current.map((row) => (row.id === data.menu.id ? data.menu : row)) : [data.menu, ...current]
      )
      setDrawerOpen(false)
      setForm(emptyForm)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    const res = await fetch('/api/settings/menus', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data?.error ?? 'ลบไม่สำเร็จ')
    setMenus((current) => current.filter((row) => row.id !== id))
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Setting</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">จัดการเมนู</h1>
        <p className="max-w-3xl text-sm font-medium text-slate-500">เพิ่ม แก้ไข ลบ menu และเลือก icon ได้ในหน้าเดียว</p>
      </header>

      <Card>
        <CardContent className="p-6 sm:p-8">
          {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => (
              <div key={menu.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    {(() => {
                      const Icon = getMenuIconComponent(menu.icon)
                      return <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                    })()}
                      <div className="text-base font-bold text-slate-950">{menu.title}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${menu.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {menu.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div>Key: {menu.key}</div>
                  <div>Path: {menu.path}</div>
                  <div>Icon: {menu.icon}</div>
                  <div>Sequence: {menu.sequence}</div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(menu)} className="gap-2">
                    <PenLine className="h-4 w-4" />
                    แก้ไข
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        ลบ
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>ลบเมนู?</AlertDialogTitle>
                        <AlertDialogDescription>เมนูนี้จะถูก soft delete</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => remove(menu.id)}>
                          ลบข้อมูล
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-950">เมนูภายใต้ Setting</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {menuOptions.map((menu) => (
                <span key={menu.id} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {menu.label}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs font-medium text-slate-500">
              Permissions: {permissionOptions.length} รายการ
            </div>
          </div>

          <div className="fixed bottom-6 right-6 z-30">
            <Button type="button" size="lg" onClick={openCreate} className="h-14 rounded-xl bg-violet-600 px-5">
              + เพิ่มเมนู
            </Button>
          </div>
        </CardContent>
      </Card>

      {drawerOpen && drawerReady ? (
        <>
          <button
            type="button"
            aria-label="Close drawer"
            className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0"
            onClick={closeDrawer}
          />
          
          <aside className="fixed right-0 top-0 z-30 h-full w-full max-w-2xl overflow-y-auto bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">{editingId ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}</h2>
              <button onClick={closeDrawer} aria-label="Close drawer">
                <X />
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Key *</Label>
                  <Input value={form.key} onChange={(e) => setForm((c) => ({ ...c, key: e.target.value }))} required />
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Path *</Label>
                  <Input value={form.path} onChange={(e) => setForm((c) => ({ ...c, path: e.target.value }))} required />
                </div>
                <div>
                  <Label>Icon *</Label>
                  <Input value={form.icon} onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value }))} placeholder="เช่น Settings, Car, LayoutDashboard" required />
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>Preview:</span>
                    {(() => {
                      const Icon = getMenuIconComponent(form.icon)
                      return <Icon className="h-4 w-4" aria-hidden="true" />
                    })()}
                    <span>{form.icon || 'Settings'}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Parent menu</Label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.parentId ?? ''}
                    onChange={(e) => setForm((c) => ({ ...c, parentId: e.target.value }))}
                  >
                    <option value="">ไม่มี</option>
                    {menuOptions.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Sequence</Label>
                  <Input
                    type="number"
                    value={form.sequence}
                    onChange={(e) => setForm((c) => ({ ...c, sequence: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label>Required Permission</Label>
                <Input
                  value={form.requiredPermission}
                  onChange={(e) => setForm((c) => ({ ...c, requiredPermission: e.target.value }))}
                  placeholder="เช่น ADMIN,STAFF"
                />
              </div>

              <div>
                <Label>Remark</Label>
                <Textarea value={form.remark} onChange={(e) => setForm((c) => ({ ...c, remark: e.target.value }))} />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-bold text-slate-950">Active</div>
                  <div className="text-xs font-medium text-slate-500">แสดงเมนูนี้ในระบบ</div>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((c) => ({ ...c, isActive: checked }))} />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-bold text-slate-950">External</div>
                  <div className="text-xs font-medium text-slate-500">ใช้กับลิงก์ภายนอก</div>
                </div>
                <Switch checked={form.isExternal} onCheckedChange={(checked) => setForm((c) => ({ ...c, isExternal: checked }))} />
              </div>

              <div className="flex items-center justify-end gap-3 w-full border-t border-slate-200 pt-5">
                <Button type="submit" disabled={busy} className="gap-2 w-full" variant="save">
                  {busy ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              </div>
            </form>
          </aside>
        </>
      ) : null}
    </div>
  )
}
