"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Coffee,
  QrCode,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { formatDateTimeVN, formatVND, PREP_STATUS_META } from "@/lib/format";
import type { RevenueReportDTO } from "@/types/cafe";

export default function ManagerRevenuePage() {
  const { roleFetch, refreshBootstrap } = useCafeSession();
  const [report, setReport] = useState<RevenueReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roleFetch("/api/manager/revenue");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không có quyền xem doanh thu.");
      } else {
        setReport(data);
      }
    } finally {
      setLoading(false);
    }
  }, [roleFetch]);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    const confirmed = window.confirm(
      `Bạn muốn hủy phiếu ${orderNumber} (do bấm nhầm hoặc khách đổi ý) và trừ khỏi doanh thu hôm nay?`
    );
    if (!confirmed) return;

    const res = await roleFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cancel",
        reason: "Quản lý hủy đơn nhập nhầm",
      }),
    });
    if (res.ok) {
      await loadRevenue();
      await refreshBootstrap();
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-8 text-center text-sm text-[#9E3526]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
            Tổng kết Doanh thu &amp; Hoạt động quán
          </h1>
          <p className="text-sm text-[#786254]">
            Số liệu dành riêng cho Quản lý quán — tự động tổng hợp từ quầy thu ngân.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRevenue}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F2E9DF] hover:bg-[#E6D8C8] text-sm font-semibold text-[#5C4638] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Cập nhật số liệu
        </button>
      </div>

      {/* 4 Warm Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Tổng tiền thực thu</span>
            <TrendingUp className="w-4 h-4 text-[#8C5A3C]" />
          </div>
          <div className="text-2xl font-bold text-[#2D1E17] tabular-nums pt-1">
            {formatVND(report?.totalRevenue ?? 0)}
          </div>
          <div className="text-xs text-[#786254]">
            {report?.paidOrdersCount ?? 0} đơn thành công • Trung bình{" "}
            {formatVND(report?.averageOrderValue ?? 0)}/đơn
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Thu bằng Tiền mặt</span>
            <Banknote className="w-4 h-4 text-[#2F6B4F]" />
          </div>
          <div className="text-2xl font-bold text-[#2F6B4F] tabular-nums pt-1">
            {formatVND(report?.cashRevenue ?? 0)}
          </div>
          <div className="text-xs text-[#786254]">Tiền mặt hiện có trong két thu ngân</div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Chuyển khoản VietQR</span>
            <QrCode className="w-4 h-4 text-[#8C5A3C]" />
          </div>
          <div className="text-2xl font-bold text-[#8C5A3C] tabular-nums pt-1">
            {formatVND(report?.vietqrRevenue ?? 0)}
          </div>
          <div className="text-xs text-[#786254]">Vào thẳng tài khoản ngân hàng của quán</div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Tổng số món đã bán</span>
            <Coffee className="w-4 h-4 text-[#8C5A3C]" />
          </div>
          <div className="text-2xl font-bold text-[#2D1E17] tabular-nums pt-1">
            {report?.totalCupsSold ?? 0} phần
          </div>
          <div className="text-xs text-[#9A5212] flex items-center gap-1">
            {(report?.lowStockIngredientsCount ?? 0) > 0 && (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                {report?.lowStockIngredientsCount} nguyên liệu sắp hết cần nhập
              </>
            )}
          </div>
        </div>
      </div>

      {/* Best Selling Drinks + Order History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <h2 className="text-base font-bold text-[#2D1E17]">
            Món bán chạy nhất hôm nay
          </h2>
          <div className="divide-y divide-[#F2E9DF]">
            {(report?.topSellingItems ?? []).map((item, idx) => (
              <div key={item.menuItemId} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#F2E9DF] text-[#8C5A3C] text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-[#2D1E17]">
                      {item.menuItemName}
                    </div>
                    <div className="text-xs text-[#786254]">
                      Đã bán: {item.quantitySold} phần
                    </div>
                  </div>
                </div>
                <span className="font-bold text-sm text-[#8C5A3C] tabular-nums">
                  {formatVND(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <h2 className="text-base font-bold text-[#2D1E17]">
             Sổ hóa đơn chi tiết trong ngày
          </h2>
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {(report?.recentOrders ?? []).map((ord) => {
              const meta = PREP_STATUS_META[ord.prepStatus];
              const isCancelled = ord.prepStatus === "DaHuy";
              return (
                <div
                  key={ord.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isCancelled
                      ? "bg-[#FAF4F2] border-[#ECC1BA] opacity-75"
                      : "bg-[#FAF6F1] border-[#E5D8C9]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#2D1E17]">
                        {ord.orderNumber} ({ord.orderType === "TaiBan" ? ord.tableName : "Mang đi"})
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.toneClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-[#786254]">
                        {formatDateTimeVN(ord.createdAt)} •{" "}
                        {ord.paymentMethod === "VietQR" ? "VietQR" : "Tiền mặt"}
                      </span>
                    </div>
                    <div className="text-xs text-[#5C4638]">
                      {ord.items.map((it) => `${it.quantity}x ${it.menuItemName}`).join(", ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span
                      className={`font-bold text-base tabular-nums ${
                        isCancelled ? "line-through text-[#9E3526]" : "text-[#2D1E17]"
                      }`}
                    >
                      {formatVND(ord.totalAmount)}
                    </span>
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(ord.id, ord.orderNumber)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-[#ECC1BA] text-[#9E3526] hover:bg-[#FCEBE8] text-xs font-semibold cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
