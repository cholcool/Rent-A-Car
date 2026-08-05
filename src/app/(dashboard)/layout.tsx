import { getCachedSession } from "@/lib/auth";
import ResponsiveShell from "@/components/ResponsiveShell";
import { getUserAccess } from "@/lib/rbac/access";
import { toMenuItems } from "@/lib/rbac/menus";
import { redirect } from "next/navigation";
// import RBACSidebar from "@/components/RBACSidebar";
import AppSidebar from "@/components/AppSidebar"


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();
  if (!session?.user?.email) redirect('/signin?reason=missing-session');

  const { menus } = await getUserAccess({ session: session.user as any, userEmail: session.user.email, rawRoles: (session.user as any)?.roles });
  const menuItems = toMenuItems(menus);

  return (
    <ResponsiveShell sidebar={<AppSidebar user={session?.user ?? null} menuItems={menuItems} />}>
      {children}
    </ResponsiveShell>
  );
}
