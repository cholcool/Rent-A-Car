"use client"

import { type FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Car, Loader2 } from 'lucide-react'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reason = searchParams.get('reason')

  useEffect(() => {
    if (reason === 'token-expired') {
      setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
      return
    }
    if (reason === 'missing-session') {
      setError('กรุณาเข้าสู่ระบบก่อนใช้งาน')
      return
    }
    setError(null)
  }, [reason])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const credential = identifier.trim()
    if (!credential || !password) return

    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      username: credential,
      email: credential,
      password,
      redirect: false,
      callbackUrl: '/post-login',
    })

    setLoading(false)

    const resultError = res?.error ?? new URL(res?.url ?? '', window.location.origin).searchParams.get('error')

    if (!res?.ok && resultError === 'CredentialsSignin') {
      setError('ชื่อผู้ใช้หรืออีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else if (!res?.ok && resultError === 'AUTH_DATABASE_ERROR') {
      setError('ระบบเชื่อมต่อฐานข้อมูลหรือยืนยันตัวตนขัดข้อง กรุณาลองใหม่อีกครั้ง')
    } else if (!res?.ok && resultError) {
      setError(`ไม่สามารถเข้าสู่ระบบได้: ${resultError}`)
    } else if (res?.ok && res?.url) {
      window.location.assign(res.url)
    } else if (res?.url) {
      window.location.assign(res.url)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br bg-[#f6f7f9] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/80 bg-white px-8 py-9 shadow-lg shadow-slate-200/70">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6F3BB7] text-white shadow-md shadow-[#6F3BB7]/20">
            <Car className="h-7 w-7" aria-hidden="true" strokeWidth={2.25} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">RentCar Admin</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">ระบบจัดการเช่ารถ</p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-1 block text-sm font-semibold text-slate-800"
            >
              Username or email
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="Username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'signin-error' : undefined}
              required
              className="block w-full rounded-lg border border-transparent bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#6F3BB7]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-semibold text-slate-800"
            >
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'signin-error' : undefined}
              required
              className="block w-full rounded-lg border border-transparent bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#6F3BB7]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6F3BB7] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4E2788] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F3BB7] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>
      </section>
    </main>
  )
}
