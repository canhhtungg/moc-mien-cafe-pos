import type { CategoryId, CupSize, IceLevel, PrepStatus, SugarLevel } from "@/types/cafe";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + "đ";
}

/**
 * Định dạng chuỗi số thành dạng có dấu chấm phân cách mỗi 3 chữ số (VD: 35000 -> "35.000")
 */
export function formatThousandDigits(raw: string | number): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits);
  if (!Number.isFinite(num)) return "";
  return new Intl.NumberFormat("vi-VN").format(num);
}

/**
 * Chuyển chuỗi có dấu phân cách 3 chữ số về số nguyên (VD: "35.000" -> 35000)
 */
export function parseThousandDigits(formatted: string): number {
  const digits = String(formatted ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) || 0;
}

/**
 * Bỏ dấu tiếng Việt để nhân viên thu ngân gõ tìm món cực nhanh (VD: "bac xiu" -> khớp "Bạc Xỉu Kem Muối")
 */
export function normalizeSearchVN(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function formatTimeVN(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatDateTimeVN(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function minutesElapsed(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  CaPhe: "Cà phê",
  TraTraiCay: "Trà trái cây",
  MatchaSua: "Matcha & Sữa",
  BanhNgot: "Bánh ăn kèm",
};

export const CUP_SIZE_OPTIONS: Array<{ value: CupSize; label: string; extraPrice: number }> = [
  { value: "S", label: "Nhỏ (S)", extraPrice: 0 },
  { value: "M", label: "Vừa (M)", extraPrice: 6000 },
  { value: "L", label: "Lớn (L)", extraPrice: 12000 },
];

export const SUGAR_OPTIONS: Array<{ value: SugarLevel; label: string }> = [
  { value: "100", label: "Ngọt vừa (100%)" },
  { value: "70", label: "Ít ngọt (70%)" },
  { value: "30", label: "Rất ít ngọt (30%)" },
  { value: "0", label: "Không đường" },
];

export const ICE_OPTIONS: Array<{ value: IceLevel; label: string }> = [
  { value: "BinhThuong", label: "Đá vừa" },
  { value: "ItDa", label: "Ít đá" },
  { value: "DaRieng", label: "Đá để riêng" },
  { value: "Nong", label: "Pha nóng" },
];

export const PREP_STATUS_META: Record<
  PrepStatus,
  { label: string; toneClass: string }
> = {
  ChoPha: {
    label: "Chờ pha",
    toneClass: "bg-[#FDF3E3] text-[#9A5212] border-[#EED3AC]",
  },
  DangPha: {
    label: "Đang pha chế",
    toneClass: "bg-[#EFE6DC] text-[#6E4226] border-[#D8C3AE]",
  },
  DaXong: {
    label: "Pha xong — Mời lấy nước",
    toneClass: "bg-[#E6F2EC] text-[#23583E] border-[#BBDACB]",
  },
  DaGiao: {
    label: "Đã phục vụ",
    toneClass: "bg-[#F3EFEA] text-[#6E5D52] border-[#DFD5CA]",
  },
  DaHuy: {
    label: "Đã hủy đơn",
    toneClass: "bg-[#FCEBE8] text-[#9E3526] border-[#ECC1BA]",
  },
};
