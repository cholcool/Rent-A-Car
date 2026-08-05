import prisma from '@/lib/prisma'
import { toNumber } from '@/lib/ui-format'
import ProductsClient from './products-client'
import { ProductRow, ProductsStatusOptions } from '@/lib/types'
import { formatCompactNumber } from '@/lib/ui-format'
import { Search } from 'lucide-react'
import { Input, Select, Button } from '@/components/ui'
import Link from 'next/link'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const inputSearch = typeof params.inputSearch === 'string' ? params.inputSearch.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const pageParam = typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const pageSize = 20
  const status = ProductsStatusOptions.find(status => status.value === statusParam)?.value ?? ''

  const where: any = { isDeleted: false }

  if (inputSearch) {
    where.OR = [
      { name: { contains: inputSearch, mode: 'insensitive' } },
      { description: { contains: inputSearch, mode: 'insensitive' } },
      { remark: { contains: inputSearch, mode: 'insensitive' } },
    ]
  }

  if (status) where.isActive = status === 'active' ? true : false;

  const orderBy: any =
    sort === 'dateEnd'
      ? { dateEnd: 'asc' }
      : sort === 'dateStart'
        ? { dateStart: 'asc' }
        : sort === 'name'
          ? { name: 'asc' }
          : sort === 'price'
          ? { price: 'asc' }
          : sort === 'priceHigh'
            ? { price: 'desc' }
          : { createdAt: 'desc' }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: pageSize,
    skip: (page - 1) * pageSize,
    select: {
      id: true,
      name: true,
      description: true,
      remark: true,
      price: true,
      dateStart: true,
      dateEnd: true,
      dateCount: true,
      isActive: true,
    },
  })
  const totalCount = await prisma.product.count({ where })
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    products_name: product.name,
    products_desc: product.description ?? '',
    products_remark: product.remark ?? '',
    products_price: toNumber(product.price),
    date_start: product.dateStart.toISOString(),
    date_end: product.dateEnd.toISOString(),
    date_count: product.dateCount,
    is_active: product.isActive,
  }))

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">ข้อมูลบริการ</h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">
              {formatCompactNumber(totalCount)}
            </div>
          </div>
        </header>

        <form
          method="get"
          action="/products"
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 md:grid-cols-[minmax(180px,1fr)_180px_160px_auto] overflow-auto"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="inputSearch" defaultValue={inputSearch} placeholder="ค้นหาข้อมูลบริการ" className="pl-10" />
          </div>

          <Select name="status" defaultValue={status}>
            <option value="">ทุกสถานะ</option>
            {ProductsStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          
          <Select name="sort" defaultValue={sort}>
            <option value="newest">ล่าสุด</option>
            <option value="dateStart">วันที่เริ่ม</option>
            <option value="dateEnd">วันที่สิ้นสุด</option>
            <option value="name">ชื่อบริการ</option>
            <option value="price">ราคาน้อย</option>
            <option value="priceHigh">ราคามาก</option>
          </Select>

          <Button type="submit" className="h-full min-h-8 md:col-start-4 xl:col-auto justify-self-end">
            <Search className="mr-2 h-4 w-4" />
            ค้นหา
          </Button>
        </form>

        <ProductsClient initialProducts={rows} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-semibold text-slate-600">
              หน้า {page} จาก {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Link
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : 0}
                href={`/products?inputSearch=${encodeURIComponent(inputSearch)}&status=${status}&sort=${sort}&page=${Math.max(page - 1, 1)}`}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                ก่อนหน้า
              </Link>
              <Link
                aria-disabled={page >= totalPages}
                tabIndex={page >= totalPages ? -1 : 0}
                href={`/products?inputSearch=${encodeURIComponent(inputSearch)}&status=${status}&sort=${sort}&page=${Math.min(page + 1, totalPages)}`}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                ถัดไป
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
