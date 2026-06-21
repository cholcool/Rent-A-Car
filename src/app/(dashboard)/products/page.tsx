import prisma from '@/lib/prisma'
import { toNumber } from '@/lib/ui-format'
import ProductsClient from './products-client'
import { ProductRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
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

  return <ProductsClient initialProducts={rows} />
}
