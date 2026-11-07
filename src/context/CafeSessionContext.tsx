"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canRoleAccessPath, ROLE_META } from "@/lib/rbac";
import type { CafeTable, MenuItem, StaffMember, ToppingOption } from "@/types/cafe";

interface ShopPublicInfo {
  shopName: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  receiptFooter: string;
}

interface CafeSessionValue {
  staffList: StaffMember[];
  currentStaff: StaffMember;
  menu: MenuItem[];
  toppings: ToppingOption[];
  tables: CafeTable[];
  shopInfo: ShopPublicInfo;
  switchStaff: (staffId: string) => void;
  refreshBootstrap: () => Promise<void>;
  applyTables: (nextTables: CafeTable[]) => void;
  roleFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const DEFAULT_STAFF_LIST: StaffMember[] = [
  { id: "NV-CASHIER", name: "Lan Anh", role: "Cashier", shiftLabel: "Thu ngân ca sáng" },
  { id: "NV-BARISTA", name: "Minh Khôi", role: "Barista", shiftLabel: "Pha chế chính" },
  { id: "NV-MANAGER", name: "Chị Thảo", role: "Manager", shiftLabel: "Quản lý quán" },
];

const DEFAULT_SHOP_INFO: ShopPublicInfo = {
  shopName: "Mộc Miên Café",
  address: "28 Ngõ Nhỏ Phố Cổ, Hoàn Kiếm, Hà Nội",
  wifiName: "MocMien_Cafe",
  wifiPassword: "henmotngayvui",
  receiptFooter: "Cảm ơn bạn đã ghé Mộc Miên hôm nay. Chúc bạn một ngày thật êm!",
};

const CafeSessionContext = createContext<CafeSessionValue>({
  staffList: DEFAULT_STAFF_LIST,
  currentStaff: DEFAULT_STAFF_LIST[0],
  menu: [],
  toppings: [],
  tables: [],
  shopInfo: DEFAULT_SHOP_INFO,
  switchStaff: () => {},
  refreshBootstrap: async () => {},
  applyTables: () => {},
  roleFetch: (input, init) => fetch(input, init),
});

export function CafeSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF_LIST);
  const [activeStaffId, setActiveStaffId] = useState<string>("NV-CASHIER");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<ToppingOption[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopPublicInfo>(DEFAULT_SHOP_INFO);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.staff) && data.staff.length > 0) setStaffList(data.staff);
      if (Array.isArray(data.menu)) setMenu(data.menu);
      if (Array.isArray(data.toppings)) setToppings(data.toppings);
      if (Array.isArray(data.tables)) setTables(data.tables);
      if (data.shopInfo) setShopInfo(data.shopInfo);
    } catch {
      // Ignore transient load error during initial boot
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const applyTables = useCallback((nextTables: CafeTable[]) => {
    setTables(nextTables);
  }, []);

  const currentStaff =
    staffList.find((s) => s.id === activeStaffId) ?? staffList[0] ?? DEFAULT_STAFF_LIST[0];

  const switchStaff = (newStaffId: string) => {
    setActiveStaffId(newStaffId);
    const nextStaff = staffList.find((s) => s.id === newStaffId);
    if (nextStaff) {
      const targetHome = ROLE_META[nextStaff.role].homeRoute;
      if (!canRoleAccessPath(nextStaff.role, pathname) || pathname !== targetHome) {
        router.push(targetHome);
      }
    }
  };

  const roleFetch = useCallback(
    (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set("x-staff-role", currentStaff.role);
      return fetch(input, { cache: "no-store", ...init, headers });
    },
    [currentStaff.role]
  );

  return (
    <CafeSessionContext.Provider
      value={{
        staffList,
        currentStaff,
        menu,
        toppings,
        tables,
        shopInfo,
        switchStaff,
        refreshBootstrap,
        applyTables,
        roleFetch,
      }}
    >
      {children}
    </CafeSessionContext.Provider>
  );
}

export function useCafeSession() {
  return useContext(CafeSessionContext);
}
