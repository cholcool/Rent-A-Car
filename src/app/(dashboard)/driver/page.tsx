import prisma from '@/lib/prisma'
import DriverPageClient from './driver-client'
import { DriverRow } from '@/lib/types' 
import { formatCompactNumber } from '@/lib/ui-format'
import { Input, Select, Button } from '@/components/ui'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DriverPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const inputSearch = typeof params.q === 'string' ? params.q.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  const where: any = { isDeleted: false }

  if (inputSearch) {
    where.OR = [
      { fullName: { contains: inputSearch, mode: 'insensitive' } },
      { phone: { contains: inputSearch, mode: 'insensitive' } },
    ]
  }

  const orderBy: any =
    sort === 'model'
      ? { model: 'asc' }
      : sort === 'year'
        ? { year: 'desc' }
        : sort === 'mileage'
          ? { mileage: 'asc' }
          : { createdAt: 'desc' }

  const drivers = await prisma.driver.findMany({
    where: where,
    orderBy: orderBy,
    include: {
      cardImage: true,
      licenseImage: true,
    },
  })

  const total = drivers.length;

  const rows: DriverRow[] = drivers.map((driver) => ({
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    remark: driver.remark ?? '',
    cardImageId: driver.cardImageId ?? '',
    licenseImageId: driver.licenseImageId ?? '',
    cardImage: driver.cardImage
      ? {
          id: driver.cardImage.id,
          url: driver.cardImage.url,
          name: driver.cardImage.name,
        }
      : null,
    licenseImage: driver.licenseImage
      ? {
          id: driver.licenseImage.id,
          url: driver.licenseImage.url,
          name: driver.licenseImage.name,
        }
      : null,
  }))

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">ข้อมูลลูกค้า</h1>
          </div>
  
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">
              {formatCompactNumber(total)}
            </div>
          </div>
        </header>
  
        <form
          method="get"
          action="/drivers"
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-3 xl:grid-cols-[minmax(220px,1fr)_180px_160px_auto] overflow-auto"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="inputSearch" defaultValue={inputSearch} placeholder="ค้นหาชื่อ เบอร์โทร" className="pl-10" />
          </div>
  
          <Select name="sort" defaultValue={sort}>
            <option value="newest">ล่าสุด</option>
            <option value="year">ปีใหม่ก่อน</option>
          </Select>
  
          <Button type="submit" className="h-11">
            ค้นหา
          </Button>
        </form>

        <DriverPageClient initialDrivers={rows} />
      </div>
    </>
  )
}
