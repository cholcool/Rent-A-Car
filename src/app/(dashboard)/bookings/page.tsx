import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import BookingsClient from './bookings-client'
import { formatCompactNumber, formatBaht } from '@/lib/ui-format'
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
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const driversParam = typeof params.drivers === 'string' ? params.drivers.trim() : ''
  const carsParam = typeof params.cars === 'string' ? params.cars.trim() : ''
  const productsParam = typeof params.products === 'string' ? params.products.trim() : ''
  const status = BookingStatusOptions.find(status => status.value === statusParam)?.value ?? ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  const where: any = { isDeleted: false }

  if (status) where.status = status
  if (driversParam) where.driver = { id: driversParam }
  if (carsParam) where.car = { id: carsParam }
  if (productsParam) where.product = { id: productsParam }

  const orderBy: any =
    sort === 'most'
      ? { netAmount: 'desc' }
      : sort === 'least'
        ? { netAmount: 'asc' }
        : sort === 'dateEnd'
          ? { dateEnd: 'desc' }
          : sort === 'dateStart'
            ? { dateStart: 'asc' }
            : { createdAt: 'desc' }

  const session = await auth()
  const currentUserId = session?.user?.id ?? ''

  const [bookings, products, cars, drivers, summary] = await Promise.all([
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
    prisma.booking.aggregate({
      where,
      _sum: { netAmount: true },
    }),
  ])

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
  // const pendingCount = bookings.filter((rows) => rows.status === 'Pending').length
  // const activeCount = bookings.filter((rows) => ['Confirmed', 'InProgress'].includes(rows.status)).length
  // const completeCount = bookings.filter((rows) => rows.status === 'Completed').length
  const initialBookings = serializePrismaRows(bookings)
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

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
              <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
              <div className="mt-2 text-3xl font-extrabold text-slate-950">
                {formatCompactNumber(totalCount)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
              <div className="text-sm font-bold text-slate-500">ยอดรวม</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {formatBaht(summary._sum.netAmount ?? 0)}
              </div>
            </div>
          </div>
        </header>

        <form
          method="get"
          action="/bookings"
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-3 xl:grid-cols-[200px_200px_auto_200px_200px_150px] overflow-auto"
        >
          <Select name="drivers" defaultValue={driversParam}>
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

          <Select name="products" defaultValue={productsParam}>
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
            <option value="most">ยอดรวมสุทธิมากสุด</option>
            <option value="least">ยอดรวมสุทธิน้อยสุด</option>
            <option value="dateStart">เรียงตามวันรับรถ</option>
            <option value="dateEnd">เรียงตามวันคืนรถ</option>
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
