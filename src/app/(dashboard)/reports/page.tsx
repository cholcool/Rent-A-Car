import Link from 'next/link'
import { Card, CardContent } from '@/components/ui'

export default async function ReportsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">รายงาน</h1>
          <p className="mt-3 text-lg font-bold text-slate-500">ไปยังหน้ารายการเอกสารและการชำระเงิน</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-500">เอกสารพิมพ์</div>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">สัญญา / ใบเสร็จ / มัดจำ</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">รวมเอกสารที่ใช้พิมพ์จริงจาก booking และ payment</p>
            <Link href="/documents" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              เปิดหน้าพิมพ์เอกสาร
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/documents/contract" className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                เปิดสัญญา
              </Link>
              <Link href="/documents/receipt" className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                เปิดใบรับเงิน
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-500">การชำระเงิน</div>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">ดูยอดค้างและเพิ่มการจ่ายเงิน</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">ใช้ drawer สรุปรายการเพื่อบันทึกรายการรับเงินจริง</p>
            <Link href="/payments" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
              เปิดหน้าชำระเงิน
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
