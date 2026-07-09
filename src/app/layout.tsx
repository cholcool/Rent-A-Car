import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentCar Admin",
  description: "ระบบจัดการเช่ารถ",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-transparent text-slate-950 antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
