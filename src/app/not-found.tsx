export default async function NotFound() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="bg-linear-to-br from-[#4E2788] via-[#6F3BB7] to-[#E0B21F] px-6 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F4E7B0]">404 not found</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">ไม่พบหน้านี้</h1>
          <p className="mt-4 text-base leading-7 text-slate-200">
            ลิงก์ที่คุณเปิดอาจถูกย้าย ลบ หรือพิมพ์ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึงหน้านี้ หากคุณคิดว่ามีข้อผิดพลาดเกิดขึ้น โปรดติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </section>
    </main>
  )
}
