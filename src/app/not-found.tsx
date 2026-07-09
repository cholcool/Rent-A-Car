import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserAccess } from '@/lib/rbac/access'
import { iconByKey, toMenuItems } from '@/lib/rbac/menus'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Car, LayoutDashboard, SearchX } from 'lucide-react'

export default async function NotFound() {
  const session = await auth()
  const { menus } = await getUserAccess({
    session: session?.user as any,
    userEmail: session?.user?.email ?? null,
    rawRoles: (session?.user as any)?.roles,
  })
  const visibleMenu = toMenuItems(menus)

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="grid lg:grid-cols-[1.4fr_1fr]">
          <div className="bg-linear-to-br from-[#4E2788] via-[#6F3BB7] to-[#E0B21F] px-6 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F4E7B0]">404 not found</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">ไม่พบหน้านี้</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">
              ลิงก์ที่คุณเปิดอาจถูกย้าย ลบ หรือพิมพ์ไม่ถูกต้อง แต่คุณยังสามารถไปต่อจากเมนูด้านล่างได้ทันที
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
                <Link href={visibleMenu[0]?.href ?? '/signin'}>
                  <LayoutDashboard className="h-4 w-4" />
                  กลับ Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href="/cars">
                  <Car className="h-4 w-4" />
                  ไปหน้ารถ
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-3">
              <SearchX className="h-6 w-6 text-[#6F3BB7]" />
              <div>
                <h2 className="text-xl font-black text-slate-950">เมนูนำทาง</h2>
                <p className="text-sm font-medium text-slate-500">เลือกทางไปต่อจากเมนูหลักของระบบ</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {visibleMenu.length > 0 ? (
                visibleMenu.map((item) => {
                  const Icon = iconByKey[item.iconKey] ?? LayoutDashboard
                  return (
                    <Card key={item.href} className="border-slate-200 bg-white/90">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-[#F4E7B0] p-2 text-[#4E2788]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-950">{item.title}</div>
                            <div className="text-xs font-medium text-slate-500">{item.href}</div>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={item.href}>
                            เปิด
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className="border-slate-200 bg-white/90">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-slate-500">ยังไม่มีเมนูที่ตรงกับสิทธิ์ของคุณ</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <footer className="mt-8 border-t border-slate-200 pt-4 text-sm font-medium text-slate-500">
              หากต้องการเริ่มใหม่ คุณสามารถไปหน้าเข้าสู่ระบบได้เสมอ
              <Link href="/signin" className="ml-2 font-bold text-[#6F3BB7] hover:text-[#4E2788]">
                ไปหน้า signin
              </Link>
            </footer>
          </div>
        </div>
      </section>
    </main>
  )
}
