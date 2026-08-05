import Link from 'next/link'
import { Card, CardContent } from '@/components/ui'

export default function DocumentsIndexPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">เอกสารพิมพ์</h1>
          <p className="mt-3 text-lg font-bold text-slate-500">เลือกประเภทเอกสารที่จะเปิดพิมพ์หรือบันทึกเป็น PDF</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-500">สัญญาค่าบริการ</div>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Vehicle Health Check / สัญญา</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">เปิดเอกสารสำหรับงานตรวจรับรถและสัญญาค่าบริการ</p>
            <Link href="/documents/contract" className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              เปิดสัญญา
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-500">เอกสารรับเงิน</div>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Receipt / Billing Slip / มัดจำ</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">เปิดเอกสารรับเงินหรือมัดจำ 1 รายการ</p>
            <Link href="/documents/receipt" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
              เปิดใบรับเงิน
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
