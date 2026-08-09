"use client";

import {
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  useSidebar
} from "@/components/ui"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Car, LogOut, ChevronsUpDown, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMenuIconComponent, isSettingMenuPath, type MenuItem } from "@/lib/rbac/menus";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
};

export default function MenuAppSidebar({ user, menuItems }: { user?: SidebarUser | null; menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const displayName = user?.name ?? user?.email ?? "Guest";
  const {  setOpenMobile } = useSidebar()
  const primaryMenus = menuItems.filter((item) => !isSettingMenuPath(item.href))
  const settingMenus = menuItems.filter((item) => isSettingMenuPath(item.href))

  return (
    <Sidebar collapsible="icon" className="fixed">
      <aside className="flex flex-col h-full relative bg-linear-to-b from-[#6F3BB7] to-[#4E2788] text-white shadow-xl shadow-[#4E2788]/25">
        <SidebarTrigger className="lg:flex hidden absolute -right-8 top-3 ml-auto bg-linear-to-b from-[#6F3BB7] to-[#4E2788] text-white shadow-xl shadow-[#4E2788]/25" slot="desktop" />

        <SidebarHeader>
          <div className="border-b border-white/15 py-9">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Car aria-hidden="true" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="font-bold leading-tight">RentCar Admin</div>
                <div className="mt-0.5 text-sm font-semibold text-[#F4E7B0]">ระบบจัดการเช่ารถ</div>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="flex-1 space-y-3 px-2">
            {primaryMenus.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = getMenuIconComponent(item.iconKey);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                        className={cn(
                          "flex items-center gap-4 rounded-xl text-base font-bold transition-colors",
                          active
                            ? "bg-white/16 text-white shadow-lg shadow-black/10"
                            : "text-[#F4E7B0] hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon aria-hidden="true" />
                        <SidebarGroup className="group-data-[collapsible=icon]:hidden">{item.title}</SidebarGroup>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <CircleUser />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="center" className="py-3">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex justify-between items-center gap-2">
                      <CircleUser />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{displayName}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="gap-2">Setting</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup className="py-2">
                    {settingMenus.length > 0 ? (
                      <>
                        {settingMenus.map((item) => {
                          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          const Icon = getMenuIconComponent(item.iconKey);

                          return (
                            <DropdownMenuItem
                              key={item.href}
                              className={cn(
                                "flex transition-colors",
                                active
                                  ? "bg-linear-to-b from-[#6F3BB7] to-[#4E2788] text-white shadow-lg shadow-black/10 hover:text-white"
                                  : "text-[#000000] hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <SidebarMenuButton asChild className="p-0 m-0">
                                <Link href={item.href} onClick={() => setOpenMobile(false)} className="p-0 m-0">
                                  <Icon aria-hidden="true" />
                                  <SidebarGroup className="group-data-[collapsible=icon]:hidden m-0 p-0">{item.title}</SidebarGroup>
                                </Link>
                              </SidebarMenuButton>
                            </DropdownMenuItem>
                          );
                        })}
                      </>
                    ) : null}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/signin" })} className="h-10">
                      <LogOut aria-hidden="true" />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </aside>
    </Sidebar>
  )
}
