"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coffee,
  ClipboardCheck,
  CupSoda,
  LayoutGrid,
  Lock,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { canRoleAccessPath, ROLE_META } from "@/lib/rbac";
import type { StaffRole } from "@/types/cafe";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: StaffRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Giao diện Thu ngân
  { href: "/order", label: "Gọi món & Tính tiền", icon: Coffee, roles: ["Cashier", "Manager"] },
  { href: "/tables", label: "Sơ đồ bàn & Đơn vừa gọi", icon: LayoutGrid, roles: ["Cashier"] },

  // Giao diện Pha chế
  { href: "/barista", label: "Phiếu nước cần pha", icon: CupSoda, roles: ["Barista", "Manager"] },
  { href: "/bar-stock", label: "Báo hết món & Nguyên liệu", icon: ClipboardCheck, roles: ["Barista"] },

  // Giao diện Quản lý (Chỉ Quản lý được thấy)
  { href: "/manager/revenue", label: "Doanh thu hôm nay", icon: TrendingUp, roles: ["Manager"] },
  { href: "/manager/menu", label: "Thực đơn & Kho", icon: SlidersHorizontal, roles: ["Manager"] },
  { href: "/manager/settings", label: "Cài đặt quán & QR", icon: Settings, roles: ["Manager"] },
];

export function CafeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { staffList, currentStaff, shopInfo, switchStaff } = useCafeSession();

  const visibleNavItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(currentStaff.role)
  );
  const isAllowed = canRoleAccessPath(currentStaff.role, pathname);
  const roleInfo = ROLE_META[currentStaff.role];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] text-[#2D1E17]">
      {/* Warm Minimalist Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-xs border-b border-[#E6D9CB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Brand + Strictly Filtered Role Navigation */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href={roleInfo.homeRoute}
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#8C5A3C] text-[#FFFDF9] flex items-center justify-center shadow-xs">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif-cafe text-lg font-semibold leading-tight text-[#2D1E17]">
                  {shopInfo.shopName}
                </div>
                <div className="text-xs text-[#786254]">
                  Không gian: <strong className="text-[#8C5A3C]">{roleInfo.label}</strong>
                </div>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-1.5" aria-label="Điều hướng theo vai trò">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#8C5A3C] text-white shadow-xs"
                        : "text-[#5C4638] hover:bg-[#EFE6DC]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Simple Role Switcher (No login required yet) */}
          <div className="flex items-center gap-2 bg-[#F2E9DF] p-1.5 rounded-2xl border border-[#E4D6C6] self-start lg:self-auto">
            <span className="hidden sm:inline-flex items-center gap-1.5 pl-2.5 pr-1 text-xs text-[#6E5849] font-medium">
              <UserCheck className="w-3.5 h-3.5 text-[#8C5A3C]" />
              Đang dùng với vai trò:
            </span>
            <div className="flex items-center gap-1">
              {staffList.map((member) => {
                const selected = member.id === currentStaff.id;
                const roleBadge =
                  member.role === "Cashier"
                    ? "Thu ngân"
                    : member.role === "Barista"
                      ? "Pha chế"
                      : "Quản lý";
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => switchStaff(member.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? "bg-[#2D1E17] text-[#FAF6F1] shadow-xs"
                        : "text-[#5C4638] hover:bg-[#E7DACB]"
                    }`}
                  >
                    {roleBadge} ({member.name})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace with Role Guard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {!isAllowed ? (
          <div className="max-w-md mx-auto mt-14 bg-white rounded-3xl border border-[#E6D9CB] p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F2E9DF] text-[#8C5A3C] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif-cafe text-xl font-semibold text-[#2D1E17]">
              Trang này không thuộc quyền của {roleInfo.label}
            </h1>
            <p className="text-sm text-[#786254] leading-relaxed">
              Bạn đang ở chế độ của <strong>{currentStaff.name} ({roleInfo.label})</strong>. Để bảo mật thông tin quán, mỗi vị trí chỉ hiển thị đúng các chức năng phục vụ công việc của mình.
            </p>
            <button
              type="button"
              onClick={() => router.push(roleInfo.homeRoute)}
              className="w-full py-3 px-5 rounded-2xl bg-[#8C5A3C] hover:bg-[#73472D] text-white text-sm font-semibold cursor-pointer"
            >
              Quay về màn hình {roleInfo.label}
            </button>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
