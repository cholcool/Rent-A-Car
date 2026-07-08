"use client"

import { type FormEvent, useMemo, useState } from 'react'
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

  const reasonMessage = useMemo(() => {
    if (reason === 'token-expired') return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
    if (reason === 'missing-session') return 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
    return null
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
      callbackUrl: '/dashboard',
    })

    setLoading(false)

    if (res?.error) {
      setError('ชื่อผู้ใช้หรืออีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else if (res?.url) {
      window.location.href = res.url
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/80 bg-white px-8 py-9 shadow-lg shadow-slate-200/70">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-md shadow-blue-700/20">
            <Car className="h-7 w-7" aria-hidden="true" strokeWidth={2.25} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">RentCar Admin</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">ระบบจัดการเช่ารถ</p>
        </div>

        {reasonMessage && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {reasonMessage}
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
              className="block w-full rounded-lg border border-transparent bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
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
              className="block w-full rounded-lg border border-transparent bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>

        <p
          id="signin-error"
          role={error ? 'alert' : undefined}
          aria-live="polite"
          className="mt-4 min-h-4 text-center text-xs text-slate-400"
        >
          {error}
        </p>
      </section>
    </main>
  )
}
