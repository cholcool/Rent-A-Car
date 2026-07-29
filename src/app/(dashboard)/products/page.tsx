import prisma from '@/lib/prisma'
import { toNumber } from '@/lib/ui-format'
import ProductsClient from './products-client'
import { ProductRow, ProductsStatusOptions } from '@/lib/types'
import { formatCompactNumber } from '@/lib/ui-format'
import { Search } from 'lucide-react'
import { Input, Select, Button } from '@/components/ui'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const inputSearch = typeof params.q === 'string' ? params.q.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const status = ProductsStatusOptions.find(status => status.value === statusParam)?.value ?? ''

  const where: any = { isDeleted: false }

  if (inputSearch) {
    where.OR = [
      { fullName: { contains: inputSearch, mode: 'insensitive' } },
      { phone: { contains: inputSearch, mode: 'insensitive' } },
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

  const total = products.length

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
              {formatCompactNumber(total)}
            </div>
          </div>
        </header>

        <form
          method="get"
          action="/products"
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 justify-end md:grid-cols-3 xl:grid-cols-[minmax(220px,1fr)_180px_160px_auto] overflow-auto"
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

          <Button type="submit" className="h-full min-h-8 col-start-3 justify-self-end">
            <Search className="mr-2 h-4 w-4" />
            ค้นหา
          </Button>
        </form>

        <ProductsClient initialProducts={rows} />
      </div>
    </>
  )
}
