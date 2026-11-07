import type { StaffRole } from "@/types/cafe";

export class ForbiddenRoleError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenRoleError";
  }
}

export const ROLE_META: Record<
  StaffRole,
  {
    label: string;
    shortDescription: string;
    homeRoute: string;
    allowedPrefixes: string[];
  }
> = {
  Cashier: {
    label: "Thu ngân & Phục vụ",
    shortDescription: "Nhận gọi món, chọn bàn, thu tiền mặt hoặc quét VietQR",
    homeRoute: "/order",
    allowedPrefixes: ["/order", "/tables"],
  },
  Barista: {
    label: "Quầy Pha chế",
    shortDescription: "Xem phiếu nước cần làm, báo pha xong và báo tạm hết món",
    homeRoute: "/barista",
    allowedPrefixes: ["/barista", "/bar-stock"],
  },
  Manager: {
    label: "Quản lý quán",
    shortDescription: "Xem doanh thu, chỉnh thực đơn, nhập nguyên liệu và cài đặt quán",
    homeRoute: "/manager/revenue",
    allowedPrefixes: [
      "/manager/revenue",
      "/manager/menu",
      "/manager/settings",
      "/order",
      "/tables",
      "/barista",
      "/bar-stock",
    ],
  },
};

export function canRoleAccessPath(role: StaffRole, pathname: string): boolean {
  if (pathname === "/") return true;
  const meta = ROLE_META[role];
  if (!meta) return false;
  return meta.allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function parseStaffRole(raw: string | null | undefined): StaffRole | null {
  if (raw === "Cashier" || raw === "Barista" || raw === "Manager") {
    return raw;
  }
  return null;
}

export function assertRoleAllowed(
  rawRole: string | null | undefined,
  allowedRoles: StaffRole[],
  actionLabel: string
): StaffRole {
  const role = parseStaffRole(rawRole);
  if (!role || !allowedRoles.includes(role)) {
    const allowedNames = allowedRoles.map((r) => ROLE_META[r].label).join(", ");
    throw new ForbiddenRoleError(
      `Chức năng "${actionLabel}" chỉ dành cho ${allowedNames}. Vui lòng chuyển đúng vai trò ở góc trên màn hình.`
    );
  }
  return role;
}
