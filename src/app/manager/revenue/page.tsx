"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  PackageCheck,
  QrCode,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { formatDateTimeVN, formatVND, PREP_STATUS_META } from "@/lib/format";
import type { RevenuePeriod, RevenueReportDTO } from "@/types/cafe";

const PERIOD_TABS: Array<{ id: RevenuePeriod; label: string; shortDesc: string }> = [
  { id: "day", label: "Theo Ngày", shortDesc: "Xem hôm nay & các ngày trước" },
  { id: "week", label: "Theo Tuần", shortDesc: "Xem tuần này & các tuần trước" },
  { id: "month", label: "Theo Tháng", shortDesc: "Xem tháng này & các tháng trước" },
];

const QUICK_OFFSETS: Record<RevenuePeriod, Array<{ offset: number; label: string }>> = {
  day: [
    { offset: 0, label: "Hôm nay" },
    { offset: 1, label: "Hôm qua" },
    { offset: 2, label: "2 ngày trước" },
    { offset: 3, label: "3 ngày trước" },
    { offset: 5, label: "5 ngày trước" },
  ],
  week: [
    { offset: 0, label: "Tuần này" },
    { offset: 1, label: "Tuần trước" },
    { offset: 2, label: "2 tuần trước" },
    { offset: 3, label: "3 tuần trước" },
  ],
  month: [
    { offset: 0, label: "Tháng này (30 ngày)" },
    { offset: 1, label: "Tháng trước" },
    { offset: 2, label: "2 tháng trước" },
  ],
};

export default function ManagerRevenuePage() {
  const { roleFetch, refreshBootstrap } = useCafeSession();
  const [period, setPeriod] = useState<RevenuePeriod>("day");
  const [offset, setOffset] = useState<number>(0);
  const [report, setReport] = useState<RevenueReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRevenue = useCallback(
    async (selectedPeriod: RevenuePeriod = period, selectedOffset: number = offset) => {
      setLoading(true);
      setError(null);
      try {
        const res = await roleFetch(
          `/api/manager/revenue?period=${selectedPeriod}&offset=${selectedOffset}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Không có quyền xem doanh thu.");
        } else {
          setReport(data);
        }
      } finally {
        setLoading(false);
      }
    },
    [roleFetch, period, offset]
  );

  useEffect(() => {
    loadRevenue(period, offset);
  }, [period, offset, loadRevenue]);

  const handleSelectPeriod = (nextPeriod: RevenuePeriod) => {
    setPeriod(nextPeriod);
    setOffset(0);
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    const confirmed = window.confirm(
      `Bạn muốn hủy phiếu ${orderNumber} (do bấm nhầm hoặc khách đổi ý) và hoàn lại nguyên liệu vào kho?`
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
      await loadRevenue(period, offset);
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

  const maxBucketRevenue = Math.max(
    1,
    ...(report?.breakdown?.map((b) => b.revenue) ?? [1])
  );

  const totalRev = report?.totalRevenue ?? 0;
  const cashPct = totalRev > 0 ? Math.round(((report?.cashRevenue ?? 0) / totalRev) * 100) : 0;
  const qrPct = totalRev > 0 ? 100 - cashPct : 0;

  const unitLabel = period === "day" ? "ngày" : period === "week" ? "tuần" : "tháng";

  return (
    <div className="space-y-6">
      {/* Header + Period Filter Tabs (Ngày / Tuần / Tháng) + Historical Offset Navigator */}
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
              Thống kê Doanh thu &amp; Phân phối Nguyên liệu
            </h1>
            <p className="text-sm text-[#786254]">
              Xem lại số liệu của các <strong className="text-[#5C4638]">ngày trước, tuần trước, tháng trước</strong> để chủ động chuẩn bị nguyên liệu theo mùa &amp; theo ngày.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadRevenue(period, offset)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F2E9DF] hover:bg-[#E6D8C8] text-sm font-semibold text-[#5C4638] cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới số liệu
          </button>
        </div>

        {/* 3 Period Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PERIOD_TABS.map((tab) => {
            const active = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectPeriod(tab.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  active
                    ? "bg-[#8C5A3C] text-white border-[#8C5A3C] shadow-xs"
                    : "bg-[#FAF6F1] text-[#2D1E17] border-[#E5D8C9] hover:bg-[#F2E9DF]"
                }`}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {tab.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      active ? "text-[#F7EFE6]" : "text-[#786254]"
                    }`}
                  >
                    {tab.shortDesc}
                  </div>
                </div>
                {active && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">
                    Đang chọn
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Historical Period Navigator (Xem lại các ngày trước / tuần trước / tháng trước) */}
        <div className="p-3.5 rounded-2xl bg-[#FAF6F1] border border-[#E5D8C9] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setOffset((prev) => prev + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2E9DF] border border-[#D8C6B4] text-xs font-bold text-[#5C4638] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Xem {unitLabel} trước đó
            </button>

            <span className="px-3.5 py-1.5 rounded-xl bg-[#2D1E17] text-white text-xs font-bold">
              Đang xem: {report?.periodLabel ?? "Đang tải..."}
            </span>

            <button
              type="button"
              disabled={offset === 0}
              onClick={() => setOffset((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2E9DF] disabled:opacity-40 border border-[#D8C6B4] text-xs font-bold text-[#5C4638] cursor-pointer"
            >
              Kỳ tiếp theo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#786254] mr-1">Chọn nhanh mốc:</span>
            {QUICK_OFFSETS[period].map((q) => {
              const isSelected = offset === q.offset;
              return (
                <button
                  key={q.offset}
                  type="button"
                  onClick={() => setOffset(q.offset)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isSelected
                      ? "bg-[#8C5A3C] text-white border-[#8C5A3C]"
                      : "bg-white text-[#5C4638] border-[#DFD1C1] hover:bg-[#F2E9DF]"
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Warm Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Thực thu ({report?.periodLabel ?? "..."})</span>
            <TrendingUp className="w-4 h-4 text-[#8C5A3C]" />
          </div>
          <div className="text-2xl font-bold text-[#2D1E17] tabular-nums pt-1">
            {formatVND(report?.totalRevenue ?? 0)}
          </div>
          <div className="text-xs text-[#786254]">
            {report?.paidOrdersCount ?? 0} đơn thành công • TB{" "}
            {formatVND(report?.averageOrderValue ?? 0)}/đơn
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Thu bằng Tiền mặt ({cashPct}%)</span>
            <Banknote className="w-4 h-4 text-[#2F6B4F]" />
          </div>
          <div className="text-2xl font-bold text-[#2F6B4F] tabular-nums pt-1">
            {formatVND(report?.cashRevenue ?? 0)}
          </div>
          <div className="text-xs text-[#786254]">Tiền mặt thực nhận trong kỳ này</div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Chuyển khoản VietQR ({qrPct}%)</span>
            <QrCode className="w-4 h-4 text-[#8C5A3C]" />
          </div>
          <div className="text-2xl font-bold text-[#8C5A3C] tabular-nums pt-1">
            {formatVND(report?.vietqrRevenue ?? 0)}
          </div>
          <div className="text-xs text-[#786254]">Vào thẳng tài khoản ngân hàng của quán</div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#786254]">
            <span>Tổng số cốc/món bán ra</span>
            <Coffee className="w-4 h-4 text-[#8C5A3C]" />
          </div>
          <div className="text-2xl font-bold text-[#2D1E17] tabular-nums pt-1">
            {report?.totalCupsSold ?? 0} phần
          </div>
          <div className="text-xs text-[#9A5212] flex items-center gap-1">
            {(report?.lowStockIngredientsCount ?? 0) > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                {report?.lowStockIngredientsCount} nguyên liệu sắp hết cần nhập
              </>
            ) : (
              <span className="text-[#2F6B4F]">Kho nguyên liệu đang đủ dùng</span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Time-Bucket Breakdown + Ingredient Consumption Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#8C5A3C]" />
              <h2 className="text-base font-bold text-[#2D1E17]">
                {period === "day"
                  ? `Phân tích theo Ca bán (${report?.periodLabel})`
                  : period === "week"
                    ? `Phân tích 7 ngày của kỳ (${report?.periodLabel})`
                    : `Phân tích 4 tuần của kỳ (${report?.periodLabel})`}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {(report?.breakdown ?? []).map((bucket, idx) => {
              const widthPct =
                bucket.revenue > 0
                  ? Math.max(6, Math.round((bucket.revenue / maxBucketRevenue) * 100))
                  : 0;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FAF6F1] border border-[#E5D8C9] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-[#2D1E17]">{bucket.label}</span>{" "}
                      <span className="text-xs text-[#786254]">({bucket.subLabel})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#786254]">
                        <strong className="text-[#2D1E17]">{bucket.ordersCount}</strong> đơn •{" "}
                        <strong className="text-[#2D1E17]">{bucket.cupsSold}</strong> món
                      </span>
                      <span className="font-bold text-sm text-[#8C5A3C] tabular-nums">
                        {formatVND(bucket.revenue)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-[#EFE6DC] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8C5A3C] transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#786254]">
                    <span>
                      Tiền mặt:{" "}
                      <strong className="text-[#2F6B4F] tabular-nums">
                        {formatVND(bucket.cashRevenue)}
                      </strong>
                    </span>
                    <span>
                      VietQR:{" "}
                      <strong className="text-[#8C5A3C] tabular-nums">
                        {formatVND(bucket.vietqrRevenue)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ingredient Consumption & Seasonal Replenishment Recommendation */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#8C5A3C]" />
              <h2 className="text-base font-bold text-[#2D1E17]">
                Tiêu hao &amp; Đề xuất phân phối nguyên liệu
              </h2>
            </div>
            <p className="text-xs text-[#786254] mt-0.5">
              Dựa trên số cốc bán ra của kỳ <strong>{report?.periodLabel}</strong> để chuẩn bị nguyên liệu hợp lý.
            </p>
          </div>

          <div className="space-y-2.5">
            {(report?.ingredientUsage ?? []).map((ing) => {
              const isLow = ing.currentStock <= ing.minStock;
              return (
                <div
                  key={ing.ingredientId}
                  className={`p-3 rounded-2xl border space-y-1 ${
                    isLow
                      ? "bg-[#FDF2EA] border-[#E08E55]"
                      : "bg-[#FAF6F1] border-[#E5D8C9]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[#2D1E17]">
                      {ing.ingredientName}
                    </span>
                    <span className="text-xs font-bold text-[#8C5A3C] tabular-nums shrink-0">
                      Đã dùng: {ing.usedAmount} {ing.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#786254]">
                    <span>
                      Tồn kho hiện tại:{" "}
                      <strong className={isLow ? "text-[#B8431E]" : "text-[#2D1E17]"}>
                        {ing.currentStock} {ing.unit}
                      </strong>
                    </span>
                    <span
                      className={`font-semibold ${
                        isLow ? "text-[#B8431E]" : "text-[#2F6B4F]"
                      }`}
                    >
                      {ing.recommendation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best Selling Drinks + Order History in Selected Period */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <h2 className="text-base font-bold text-[#2D1E17]">
            Món bán chạy nhất ({report?.periodLabel})
          </h2>
          {(report?.topSellingItems ?? []).length === 0 ? (
            <div className="py-6 text-center text-sm text-[#786254]">
              Chưa có đơn hàng nào trong kỳ thời gian này. Bạn có thể bấm chọn mốc thời gian khác ở trên.
            </div>
          ) : (
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
          )}
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2D1E17]">
              Sổ hóa đơn trong kỳ ({report?.recentOrders?.length ?? 0} đơn)
            </h2>
            <span className="text-xs text-[#786254]">{report?.periodLabel}</span>
          </div>
          {(report?.recentOrders ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-[#786254]">
              Không có hóa đơn nào trong mốc thời gian đang chọn.
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
