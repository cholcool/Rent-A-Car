import prisma from '@/lib/prisma'
import { serializePrismaRows } from '@/lib/serialize'
import { formatBaht, formatThaiDate } from '@/lib/ui-format'
import DocumentPreview from '@/components/DocumentPreview'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ContractDocumentPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : ''

  const booking = await prisma.booking.findFirst({
    where: bookingId ? { id: bookingId, isDeleted: false } : { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      car: { include: { brand: true } },
      payments: {
        where: { isDeleted: false },
        orderBy: { paymentDate: 'desc' },
      },
    },
  })

  const bookingRow = booking ? serializePrismaRows([booking])[0] : null

  return (
    <DocumentPreview
      mode="contract"
      booking={
        bookingRow
          ? {
              ...bookingRow,
              dateStartLabel: formatThaiDate(bookingRow.dateStart),
              dateEndLabel: formatThaiDate(bookingRow.dateEnd),
            }
          : null
      }
      formatBaht={formatBaht}
    />
  )
}
