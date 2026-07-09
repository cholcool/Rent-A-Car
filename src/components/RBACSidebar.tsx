"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Car, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconByKey, type MenuItem } from "@/lib/rbac/menus";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
};

export default function RBACSidebar({ user, menuItems }: { user?: SidebarUser | null; menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const displayName = user?.name ?? user?.email ?? "Guest";

  return (
    <aside className="flex h-full w-72 flex-col bg-blue-800 text-white shadow-xl shadow-blue-950/20">
      <div className="border-b border-white/15 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
            <Car className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xl font-bold leading-tight">RentCar Admin</div>
            <div className="mt-0.5 text-sm font-semibold text-blue-100">ระบบจัดการเช่ารถ</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 px-4 py-6">
        {menuItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = iconByKey[item.iconKey] ?? Car;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-bold transition-colors",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/15"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/15 px-6 py-7">
        <div className="mb-7">
          <div className="truncate text-base font-bold">{displayName}</div>
          <div className="mt-1 truncate text-sm font-medium text-blue-100">{user?.email ?? 'User'}</div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left text-sm font-bold text-blue-100 transition hover:text-white"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
