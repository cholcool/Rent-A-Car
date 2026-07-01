import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import BookingsClient from './bookings-client'
import { formatCompactNumber } from '@/lib/ui-format'
import { Select, Button } from '@/components/ui'
import { Search } from 'lucide-react'
import { BookingStatusOptions, type DriverRow } from '@/lib/types'
import { serializePrismaRows } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const inputSearch = typeof params.inputSearch === 'string' ? params.inputSearch.trim() : ''
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const status = BookingStatusOptions.find(status => status.value === statusParam)?.value ?? ''
  const brand = typeof params.brand === 'string' ? params.brand.trim() : ''
  const carsParam = typeof params.cars === 'string' ? params.cars.trim() : ''
  const vehicleType = typeof params.vehicleType === 'string' ? params.vehicleType.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  const where: any = { isDeleted: false }

  if (inputSearch) {
    where.OR = [
      { model: { contains: inputSearch, mode: 'insensitive' } },
      { license: { contains: inputSearch, mode: 'insensitive' } },
      { color: { contains: inputSearch, mode: 'insensitive' } },
      { engine: { contains: inputSearch, mode: 'insensitive' } },
      { chassis: { contains: inputSearch, mode: 'insensitive' } },
      { brand: { name: { contains: inputSearch, mode: 'insensitive' } } },
      { vehicleType: { name: { contains: inputSearch, mode: 'insensitive' } } },
    ]
  }

  if (status) where.status = status
  if (brand) where.brand = { name: { contains: brand, mode: 'insensitive' } }
  if (vehicleType) where.vehicleType = { name: { contains: vehicleType, mode: 'insensitive' } }

  const orderBy: any =
    sort === 'model'
      ? { model: 'asc' }
      : sort === 'year'
        ? { year: 'desc' }
        : sort === 'mileage'
          ? { mileage: 'asc' }
          : { createdAt: 'desc' }

  const session = await auth()
  const currentUserId = session?.user?.id ?? ''

  const [bookings, products, cars, drivers] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy,
      include: {
        user: true,
        car: { include: { brand: true } },
        driver: true,
        product: true,
        paymentImage: true,
        healthCheck01Image: true,
        healthCheck02Image: true,
      },
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true },
    }),
    prisma.car.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true, model: true, license: true, brand: { select: { name: true } }, status: true },
    }),
    prisma.driver.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        cardImage: true,
        licenseImage: true,
        guarantor: {
          include: {
            cardImage: true,
            licenseImage: true,
          },
        },
      },
    }),
  ])

  const initialBookings = serializePrismaRows(bookings)

  const initialDrivers: DriverRow[] = drivers.map((driver) => ({
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    remark: driver.remark ?? null,
    cardImageId: driver.cardImageId ?? null,
    licenseImageId: driver.licenseImageId ?? null,
    cardImage: driver.cardImage
      ? {
          id: driver.cardImage.id,
          key: driver.cardImage.key,
          url: driver.cardImage.url,
          name: driver.cardImage.name,
          size: driver.cardImage.size ? Number(driver.cardImage.size) : undefined,
          type: driver.cardImage.type ?? undefined,
          remark: driver.cardImage.remark ?? undefined,
        }
      : null,
    licenseImage: driver.licenseImage
      ? {
          id: driver.licenseImage.id,
          key: driver.licenseImage.key,
          url: driver.licenseImage.url,
          name: driver.licenseImage.name,
          size: driver.licenseImage.size ? Number(driver.licenseImage.size) : undefined,
          type: driver.licenseImage.type ?? undefined,
          remark: driver.licenseImage.remark ?? undefined,
        }
      : null,
    guarantor: driver.guarantor
      ? {
          id: driver.guarantor.id,
          fullName: driver.guarantor.fullName,
          phone: driver.guarantor.phone,
          remark: driver.guarantor.remark ?? null,
          cardImageId: driver.guarantor.cardImageId ?? null,
          licenseImageId: driver.guarantor.licenseImageId ?? null,
          cardImage: driver.guarantor.cardImage
            ? {
                id: driver.guarantor.cardImage.id,
                key: driver.guarantor.cardImage.key,
                url: driver.guarantor.cardImage.url,
                name: driver.guarantor.cardImage.name,
                size: driver.guarantor.cardImage.size ? Number(driver.guarantor.cardImage.size) : undefined,
                type: driver.guarantor.cardImage.type ?? undefined,
                remark: driver.guarantor.cardImage.remark ?? undefined,
              }
            : null,
          licenseImage: driver.guarantor.licenseImage
            ? {
                id: driver.guarantor.licenseImage.id,
                key: driver.guarantor.licenseImage.key,
                url: driver.guarantor.licenseImage.url,
                name: driver.guarantor.licenseImage.name,
                size: driver.guarantor.licenseImage.size ? Number(driver.guarantor.licenseImage.size) : undefined,
                type: driver.guarantor.licenseImage.type ?? undefined,
                remark: driver.guarantor.licenseImage.remark ?? undefined,
              }
            : null,
        }
      : null,
  }))

  const totalCount = bookings.length
  const pendingCount = bookings.filter((rows) => rows.status === 'Pending').length
  const activeCount = bookings.filter((rows) => ['Confirmed', 'InProgress'].includes(rows.status)).length
  const completeCount = bookings.filter((rows) => rows.status === 'Completed').length
  const carsAvailable = cars.filter((rows) => rows.status === 'Available')
  const carsOption = cars.map((rows) => ({ value: rows.id, label: `${rows.brand.name} ${rows.model}`.trim() }))
  const driversOption = drivers.map((rows) => ({ value: rows.id, label: `${rows.fullName} (${rows.phone})`.trim() }))
  const productsOption = products.map((rows) => ({ value: rows.id, label: `${rows.name} - ${rows.price}`.trim() }))

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">บันทึกรายการ</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-80 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
              <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
              <div className="mt-2 text-3xl font-extrabold text-slate-950">{formatCompactNumber(totalCount)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
              <div className="text-sm font-bold text-slate-500">รอยืนยัน</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {formatCompactNumber(pendingCount)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
              <div className="text-sm font-bold text-slate-500">กำลังดำเนินการ</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {formatCompactNumber(activeCount)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
              <div className="text-sm font-bold text-slate-500">เสร็จสิ้น</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {formatCompactNumber(completeCount)}
              </div>
            </div>
          </div>
        </header>

        <form
          method="get"
          action="/bookings"
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-3 xl:grid-cols-[200px_200px_200px_200px_200px__auto] overflow-auto"
        >
          <Select name="cars" defaultValue={carsParam}>
            <option value="">ลูกค้าทั้งหมด</option>
            {driversOption.map((rows: any) => (
              <option key={rows.value} value={rows.value}>
                {rows.label}
              </option>
            ))}
          </Select>

          <Select name="cars" defaultValue={carsParam}>
            <option value="">รถทั้งหมด</option>
            {carsOption.map((rows: any) => (
              <option key={rows.value} value={rows.value}>
                {rows.label}
              </option>
            ))}
          </Select>

          <Select name="cars" defaultValue={carsParam}>
            <option value="">บริการทั้งหมด</option>
            {productsOption.map((rows: any) => (
              <option key={rows.value} value={rows.value}>
                {rows.label}
              </option>
            ))}
          </Select>

          <Select name="status" defaultValue={status}>
            <option value="">ทุกสถานะ</option>
            {BookingStatusOptions.map((status) => (
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

          <Button type="submit" className="h-11">
            <Search className="mr-2 h-4 w-4" />
            ค้นหา
          </Button>
        </form>

        <BookingsClient
          initialBookings={initialBookings}
          currentUserId={currentUserId}
          products={products.map((product) => ({ id: product.id, label: `${product.name} - ${product.price}` , price: Number(product.price) }))}
          cars={carsAvailable.map((car) => ({ id: car.id, label: `${car.brand.name} ${car.model} (${car.license})` }))}
          drivers={drivers.map((driver) => ({ id: driver.id, label: `${driver.fullName} (${driver.phone})` }))}
          initialDrivers={initialDrivers}
        />
      </div>
    </>
  )
}
