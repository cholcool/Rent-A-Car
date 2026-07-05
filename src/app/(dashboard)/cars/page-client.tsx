'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatCompactNumber,
  getStatusBadgeClass,
  getStatusLabel,
  toNumber,
} from '@/lib/ui-format'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import { CarsRow } from '@/lib/types'
import { sortMaintenancesForAlert } from '@/lib/maintenance-status'

interface PageProps {
  carsIn?: CarsRow[]
}

export default function PageClient({carsIn} : PageProps ) {

  const [error, setError] = useState('')
  const [cars, setCars] = useState<CarsRow[]>(carsIn || [])

  async function deleteItem(id: string) {
    const res = await fetch('/api/cars', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error ?? 'ไม่สามารถลบข้อมูลได้')
      return
    }
    setCars((current) => current.filter((item) => item.id !== id))
  }

  useEffect(() => {
    if (carsIn) {
      setCars(carsIn)
    }
  }, [carsIn])

  useEffect(() => {
    const timer = window.setInterval(() => {
      window.location.reload()
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">รายการล่าสุด</h2>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-245 text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                  <th className="px-3 py-3">ยี่ห้อ/รุ่น</th>
                  <th className="px-3 py-3">ปี</th>
                  <th className="px-3 py-3">ทะเบียน</th>
                  <th className="px-3 py-3">สี</th>
                  <th className="px-3 py-3">ประเภท</th>
                  <th className="px-3 py-3 text-right">เลขไมล์</th>
                  <th className="px-3 py-3">สถานะ</th>
                  <th className="px-3 py-3">แจ้งเตือน</th>
                  <th className='px-3 py-3 text-right'>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => {
                  return (
                    <tr key={car.id} className="border-b border-slate-200">
                      <td className="px-3 py-3">{car.brand?.name} {car.model}</td>
                      <td className="px-3 py-3">{car.year}</td>
                      <td className="px-3 py-3">{car.license}</td>
                      <td className="px-3 py-3">{car.color}</td>
                      <td className="px-3 py-3">{car.vehicleType?.name}</td>
                      <td className="px-3 py-3 text-right">{formatCompactNumber(toNumber(car.mileage))}</td>
                      <td className="px-3 py-3"><Badge className={getStatusBadgeClass(car.status)}>{getStatusLabel(car.status)}</Badge></td>
                      <td className='px-3 py-3'>
                        {(() => {
                          // 1. กรองเอาเฉพาะอันที่สถานะเป็น Active เท่านั้น
                          const alertMaintenances = [...(car.maintenances || [])]
                            .filter((m) => m.status === 'Active' || m.status === 'Overdue')
                            .sort(sortMaintenancesForAlert)

                          const latestActive = alertMaintenances[0];

                          // 3. แสดงผล Badge หากมีข้อมูลตรงตามเงื่อนไข
                          if (latestActive) {
                            return (
                              <>
                                <Badge className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-black">
                                  <BellRing className="mr-1 inline-block text-xs text-yellow-500" /> 
                                  {getStatusLabel(latestActive.type) ?? ''}
                                </Badge>
                              </>
                            );
                          }

                          // 4. กรณีไม่มีงานซ่อมบำรุงที่กำลัง Active อยู่เลย ให้ขึ้นเครื่องหมายขีด
                          return <span className="text-slate-400"></span>;
                        })()}
                      </td>
                      <td className='px-3 py-3 text-right'>
                        <div className="flex justify-end gap-2">
                          <Button asChild size={"sm"} variant="ghost">
                            <Link href={`/cars/${car.id}`}>
                              <Edit className="size-4" />
                            </Link>
                          </Button>
                          <AlertDialogDestructive onClick={() => deleteItem(car.id)} variant={'destructive'} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
