import { PaymentStatus } from '@prisma/client'

export function getPaidAmount(payments: Array<{ amount: unknown; paymentStatus?: PaymentStatus; isDeleted?: boolean }>) {
  return payments.reduce((sum, payment) => {
    if (payment.isDeleted) return sum
    if (payment.paymentStatus !== PaymentStatus.Paid) return sum
    const amount = typeof payment.amount === 'number' ? payment.amount : Number(payment.amount ?? 0)
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
}

