export type MenuItem = {
  title: string;
  href: string;
  roles?: string[];
};

export const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/dashboard", roles: ["admin", "manager"] },
  { title: "ระบบจัดการรถยนต์", href: "/cars", roles: ["admin", "manager", "agent", "user"] },
  { title: "ข้อมูลลูกค้า", href: "/driver", roles: ["admin", "manager", "agent", "user"] },
  { title: "ข้อมูลบริการ/โปรโมชั่น", href: "/products", roles: ["admin", "manager", "agent", "user"] },
  { title: "รายการเช่ารถ", href: "/bookings", roles: ["admin", "manager", "agent", "user"] },
  // { title: "การชำระเงิน", href: "/payments", roles: ["admin", "manager", "agent", "user"] },
  { title: "ตั้งค่าระบบ", href: "/setting/users", roles: ["admin", "manager"] },
  { title: "ตั้งค่าระบบ", href: "/setting/roles", roles: ["admin", "manager"] },
  { title: "ตั้งค่าระบบ", href: "/setting/permissions", roles: ["admin", "manager"] },
];

export default menuItems;
