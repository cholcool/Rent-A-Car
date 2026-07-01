import type { ComponentType } from "react";
import { Car, ClipboardList, CreditCard, LayoutDashboard, Settings, Tag, Users } from "lucide-react";

export type MenuItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles?: string[];
};

export const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { title: "จัดการรถ", href: "/cars", icon: Car, roles: ["admin", "manager", "agent", "user"] },
  { title: "ข้อมูลลูกค้า", href: "/driver", icon: Users, roles: ["admin", "manager", "agent", "user"] },
  { title: "ข้อมูลบริการ", href: "/products", icon: Tag, roles: ["admin", "manager", "agent", "user"] },
  { title: "บันทึกรายการ", href: "/bookings", icon: ClipboardList, roles: ["admin", "manager", "agent", "user"] },
  { title: "การชำระเงิน", href: "/payments", icon: CreditCard, roles: ["hidden"] },
  { title: "ตั้งค่าระบบ", href: "/setting/users", icon: Settings, roles: ["admin", "manager"] },
  { title: "ตั้งค่าระบบ", href: "/setting/roles", icon: LayoutDashboard, roles: ["hidden"] },
  { title: "ตั้งค่าระบบ", href: "/setting/permissions", icon: LayoutDashboard, roles: ["hidden"] },
];

export default menuItems;
