import type { ComponentType } from "react";
import { Car, ClipboardList, CreditCard, LayoutDashboard, Settings, Tag, Users } from "lucide-react";
import { appAccessMap } from "./access";

export type MenuItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const iconByKey: Record<string, MenuItem["icon"]> = {
  dashboard: LayoutDashboard,
  car: Car,
  users: Users,
  tag: Tag,
  clipboard: ClipboardList,
  creditCard: CreditCard,
  settings: Settings,
};

export const menuItems: MenuItem[] = appAccessMap.map((item) => ({
  title: item.title,
  href: item.href,
  icon: iconByKey[item.iconKey] ?? Settings,
}));

export default menuItems;
