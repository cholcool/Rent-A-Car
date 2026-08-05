import Link from 'next/link'
import { ShieldAlert, ArrowRight, Car, LayoutDashboard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { getDefaultLandingPath } from '@/lib/rbac/access'

export default async function UnauthorizedPage() {
  const session = await auth()
  const target = await getDefaultLandingPath({
    session: session?.user as any,
    userEmail: session?.user?.email ?? null,
    rawRoles: (session?.user as any)?.roles,
  })

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
        <div className="bg-linear-to-r from-[#4E2788] via-[#6F3BB7] to-[#E0B21F] px-6 py-10 text-white sm:px-10">
          <div className="flex max-w-3xl items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F4E7B0]">Access denied</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">
                ระบบตรวจพบว่า role ปัจจุบันไม่ตรงกับสิทธิ์ของหน้านี้ จึงพาคุณออกจากหน้าที่ไม่อนุญาตเพื่อป้องกันการใช้งานผิดสิทธิ์
              </p>
            </div>
          </div>
        </div>

        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 lg:p-10">
          <Card className="border-slate-200 bg-slate-50/90">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-[#6F3BB7]" />
                <h2 className="text-base font-bold text-slate-950">ไปหน้าเริ่มต้น</h2>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">กลับไปยังหน้าแรกที่ role นี้เข้าถึงได้</p>
              <Button asChild className="mt-4 w-full">
                <Link href={target}>
                  เปิดหน้าเริ่มต้น
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/90">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-[#6F3BB7]" />
                <h2 className="text-base font-bold text-slate-950">ไปจัดการรถ</h2>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">เริ่มต้นจากหน้าที่ใช้ได้กับหลาย role</p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/cars">
                  เปิดหน้ารถ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/90 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-950">เปลี่ยนบัญชี</h2>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">หาก role ไม่ถูกต้องให้เข้าสู่ระบบใหม่ด้วยบัญชีที่เหมาะสม</p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/signin">
                  ไปหน้าเข้าสู่ระบบ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </section>
    </div>
  )
}
