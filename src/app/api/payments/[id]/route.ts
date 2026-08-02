import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getPaidAmount } from '@/lib/payment-summary'
import { getCachedSession } from '@/lib/auth'

export async function PATCH(
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

  const payment = await prisma.payment.findFirst({ where: { id, isDeleted: false } })
  if (!payment) return NextResponse.json({ message: 'Payment not found' }, { status: 404 })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: payment.bookingId, isDeleted: false },
        include: { payments: { where: { isDeleted: false } } },
      })
      if (!booking) throw new Error('Booking not found')

      const others = booking.payments.filter((row) => row.id !== payment.id)
      const paidAmount = getPaidAmount(others)
      const totalAmount = Number(booking.netAmount ?? 0)
      if (amount + paidAmount > totalAmount) throw new Error('Amount exceeds remaining balance')

      const updated = await tx.payment.update({
        where: { id },
        data: {
          amount: new Prisma.Decimal(amount),
          paymentMethod: (paymentMethod ?? payment.paymentMethod) as any,
          updatedBy: userId,
        },
      })

      const nextPaid = paidAmount + amount
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: (nextPaid >= totalAmount ? 'Completed' : nextPaid > 0 ? 'PartialPaid' : booking.status) as any,
          updatedBy: userId,
        },
      })

      return updated
    })

    return NextResponse.json({ payment: result })
  } catch (error: any) {
    const message = String(error?.message ?? '')
    if (message === 'Booking not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Amount exceeds remaining balance') {
      return NextResponse.json({ message: 'จำนวนเงินเกินยอดคงเหลือ' }, { status: 409 })
    }
    return NextResponse.json({ message: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession();
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const payment = await prisma.payment.findFirst({ where: { id, isDeleted: false } })
  if (!payment) return NextResponse.json({ message: 'Payment not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: { isDeleted: true, updatedBy: userId },
    })

    const booking = await tx.booking.findFirst({
      where: { id: payment.bookingId, isDeleted: false },
      include: { payments: { where: { isDeleted: false } } },
    })
    if (!booking) return

    const remainingPayments = booking.payments.filter((row) => row.id !== id)
    const paidAmount = getPaidAmount(remainingPayments)
    const totalAmount = Number(booking.netAmount ?? 0)
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: (paidAmount >= totalAmount ? 'Completed' : paidAmount > 0 ? 'PartialPaid' : 'Pending') as any,
        updatedBy: userId,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
