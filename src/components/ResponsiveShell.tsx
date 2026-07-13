"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui"


export default function ResponsiveShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider className="bg-[#f6f7f9]">
      <div className="min-h-screen bg-[#f6f7f9] w-full" slot="main-screen">
        <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} slot="mobile">
          <div
            className={`absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
            onClick={() => setOpen(false)}
          />
          <div className={`absolute inset-y-0 left-0 transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
            <button
              type="button"
              aria-label="Close sidebar"
              className="absolute right-3 top-3 z-10 rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarTrigger className={`${open ? "opacity-100" : "opacity-0"} absolute -right-7 top-10 ml-auto text-white`} />
            {sidebar}
          </div>
        </div>

        <div data-slot="sidebar-wrapper" className="flex min-h-screen">
          <div className="hidden lg:flex" data-slot="sidebar" slot="desktop">
            {sidebar}
          </div>
          
          <SidebarInset
            data-slot="sidebar-inset"
            slot="body"
            className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#f6f7f9] transition-[margin-left,width] duration-200 ease-linear md:peer-data-[state=collapsed]:ml-[3rem] lg:pl-0"
          >
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
              <button
                type="button"
                aria-label="Open sidebar"
                className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-base font-bold text-slate-950">RentCar Admin</span>
            </header>
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-6 lg:py-10">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
