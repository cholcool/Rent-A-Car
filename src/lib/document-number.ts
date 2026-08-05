import prisma from '@/lib/prisma'

function formatMonthlyNumber(prefix: string, next: number) {
  return `${prefix}${String(next).padStart(4, '0')}`
}

export async function generateMonthlyDocumentNumber(options: {
  model: 'booking' | 'payment'
  field: 'contractNo' | 'receiptNo'
  prefixDate?: Date
}) {
  const field = options.field === 'contractNo' ? 'DN' : 'RE'
  const now = options.prefixDate ?? new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = field + yearMonth

  const model = options.model === 'booking' ? prisma.booking : prisma.payment
  const rows = await (model as any).findMany({
    where: {
      [options.field]: { startsWith: prefix },
      isDeleted: false,
    },
    select: { [options.field]: true },
    orderBy: { [options.field]: 'desc' },
    take: 1,
  })

  const lastNo = String(rows[0]?.[options.field] ?? '')
  const lastSeq = Number(lastNo.slice(8)) || 0
  return formatMonthlyNumber(prefix, lastSeq + 1)
}
