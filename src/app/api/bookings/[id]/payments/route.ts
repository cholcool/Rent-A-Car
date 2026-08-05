import { NextResponse } from 'next/server'
import { Prisma, PaymentStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { serializePrismaRows } from '@/lib/serialize'
import { getPaidAmount } from '@/lib/payment-summary'
import { generateMonthlyDocumentNumber } from '@/lib/document-number'
import { getCachedSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const booking = await prisma.booking.findFirst({
    where: { id, isDeleted: false },
    include: {
      payments: { where: { isDeleted: false }, orderBy: { paymentDate: 'desc' } },
      user: true,
      car: { include: { brand: true } },
    },
  })
  if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })

  const paidAmount = getPaidAmount(booking.payments)
  const totalAmount = Number(booking.netAmount ?? 0)
  return NextResponse.json({
    booking: serializePrismaRows([booking])[0],
    payments: serializePrismaRows(booking.payments),
    summary: {
      totalAmount,
      paidAmount,
      remainingAmount: Math.max(totalAmount - paidAmount, 0),
      paymentCount: booking.payments.length,
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession();
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const amount = Number(body.amount ?? 0)
  const paymentMethod = body.paymentMethod as string

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: 'amount is required' }, { status: 400 })
  }
  if (!paymentMethod) {
    return NextResponse.json({ message: 'paymentMethod is required' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id, isDeleted: false },
        include: { payments: { where: { isDeleted: false } } },
      })
      if (!booking) throw new Error('Booking not found')

      const paidAmount = getPaidAmount(booking.payments)
      const totalAmount = Number(booking.netAmount ?? 0)
      const remainingAmount = Math.max(totalAmount - paidAmount, 0)
      if (amount > remainingAmount) {
        throw new Error('Amount exceeds remaining balance')
      }

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          receiptNo: await generateMonthlyDocumentNumber({ model: 'payment', field: 'receiptNo' }),
          amount: new Prisma.Decimal(amount),
          paymentMethod: paymentMethod as any,
          paymentStatus: PaymentStatus.Paid,
          createdBy: userId,
          updatedBy: userId,
        } as any,
      })

      const nextPaid = paidAmount + amount
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: (nextPaid >= totalAmount ? 'Completed' : nextPaid > 0 ? 'PartialPaid' : booking.status) as any,
          updatedBy: userId,
        },
      })

      return payment
    })

    return NextResponse.json({ payment: result })
  } catch (error: any) {
    const message = String(error?.message ?? '')
    if (message === 'Booking not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Amount exceeds remaining balance') {
      return NextResponse.json({ message: 'จำนวนเงินเกินยอดคงเหลือ' }, { status: 409 })
    }
    return NextResponse.json({ message: 'Failed to create payment' }, { status: 500 })
  }
}
