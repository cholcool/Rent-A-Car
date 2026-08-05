import prisma from '@/lib/prisma'
import { serializePrismaRows } from '@/lib/serialize'
import { formatBaht, formatThaiDate } from '@/lib/ui-format'
import DocumentPreview from '@/components/DocumentPreview'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReceiptDocumentPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const paymentId = typeof params.paymentId === 'string' ? params.paymentId : ''

  const payment = await prisma.payment.findFirst({
    where: paymentId ? { id: paymentId, isDeleted: false } : { isDeleted: false },
    orderBy: { paymentDate: 'desc' },
    include: {
      booking: {
        include: {
          user: true,
          car: { include: { brand: true } },
        },
      },
    },
  })

  const paymentRow = payment ? serializePrismaRows([payment])[0] : null

  return (
    <DocumentPreview
      mode="receipt"
      payment={
        paymentRow
          ? {
              ...paymentRow,
              paymentDateLabel: formatThaiDate(paymentRow.paymentDate),
            }
          : null
      }
      formatBaht={formatBaht}
    />
  )
}
