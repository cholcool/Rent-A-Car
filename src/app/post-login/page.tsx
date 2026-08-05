import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getDefaultLandingPath } from '@/lib/rbac/access'

export default async function PostLoginPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/signin?reason=missing-session')

  const target = await getDefaultLandingPath({
    session: session.user as any,
    userEmail: session.user.email,
    rawRoles: (session.user as any)?.roles,
  })

  redirect(target)
}
