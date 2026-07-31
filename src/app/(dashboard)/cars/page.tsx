import { Car, Search } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Input, Select, Card, CardContent, Button } from '@/components/ui'
import { formatCompactNumber } from '@/lib/ui-format'
import SpeedDialContainer from '@/components/SpeedDialContainer'
import PageClient from "./page-client"
import { CarStatusOptions, type CarsRow } from '@/lib/types'
import { syncMaintenanceStatuses } from '@/lib/maintenance-sync'
import { buildCarOrderBy, buildCarWhere, parseCarListQuery } from '@/lib/cars/query'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CarsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const { inputSearch, status, brand, vehicleType, sort } = parseCarListQuery(params)
  const where = buildCarWhere({ inputSearch, status, brand, vehicleType, sort })
  const orderBy = buildCarOrderBy(sort)

  await syncMaintenanceStatuses()

  const [cars, availableCars, vehicleTypes, brands] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy,
      take: 48,
      include: {
        brand: true,
        vehicleType: true,
        maintenances: true,
        images: {
          include: { image: true },
          orderBy: { number: 'asc' },
        },
      },
    }),
    prisma.car.count({ where: { isDeleted: false, status: 'Available' } }),
    prisma.vehicleType.findMany({ where: { isDeleted: false } }),
    prisma.brand.findMany({ where: { isDeleted: false } }),
  ]) as [CarsRow[], number, { id: string; name: string }[], { id: string; name: string }[]]

  const totalCars = cars.length

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">จัดการรถ</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">{formatCompactNumber(totalCars)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">พร้อมให้เช่า</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">
              {formatCompactNumber(availableCars)}
            </div>
          </div>
        </div>
      </header>

      <form
        method="get"
        action="/cars"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 md:grid-cols-3 xl:grid-cols-[minmax(220px,1fr)_180px_160px_160px_150px_auto] overflow-auto"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="inputSearch" defaultValue={inputSearch} placeholder="ค้นหารถ รุ่น ทะเบียน" className="pl-10" />
        </div>
        
        <Select name="vehicleType" defaultValue={vehicleType}>
          <option value="">ทุกประเภท</option>
          {vehicleTypes.map((type: any) => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))}
        </Select>

        <Select name="brand" defaultValue={brand}>
          <option value="">ทุกยี่ห้อ</option>
          {brands.map((brand: any) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </Select>

        <Select name="status" defaultValue={status}>
          <option value="">ทุกสถานะ</option>
          {CarStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>

        <Select name="sort" defaultValue={sort}>
          <option value="newest">ล่าสุด</option>
          <option value="model">เรียงตามรุ่น</option>
          <option value="year">ปีใหม่ก่อน</option>
          <option value="mileage">ไมล์น้อยก่อน</option>
        </Select>

        <Button type="submit" className="h-full min-h-8 md:col-start-3 xl:col-auto justify-self-end">
          <Search className="mr-2 h-4 w-4" />
          ค้นหา
        </Button>
      </form>

      {cars.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Car className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-slate-950">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง</p>
          </CardContent>
        </Card>
      )}

      {cars.length > 0 && (
        <PageClient carsIn={cars} />
      )}

      <SpeedDialContainer />
    </div>
  )
}
