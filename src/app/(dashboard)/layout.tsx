import { auth } from "@/lib/auth";
import RBACSidebar from "@/components/RBACSidebar";
import ResponsiveShell from "@/components/ResponsiveShell";
import { getUserAccess } from "@/lib/rbac/access";
import { toMenuItems } from "@/lib/rbac/menus";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect('/signin?reason=missing-session');

  const { menus } = await getUserAccess({ session: session.user as any, userEmail: session.user.email, rawRoles: (session.user as any)?.roles });
  const menuItems = toMenuItems(menus);

  return (
    <ResponsiveShell sidebar={<RBACSidebar user={session?.user ?? null} menuItems={menuItems} />}>
      {children}
    </ResponsiveShell>
  );
}
