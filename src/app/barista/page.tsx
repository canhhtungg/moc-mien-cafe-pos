"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, CupSoda, Flame, RefreshCw } from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import {
  formatTimeVN,
  ICE_OPTIONS,
  minutesElapsed,
  SUGAR_OPTIONS,
} from "@/lib/format";
import type { CafeOrder, PrepStatus } from "@/types/cafe";

export default function BaristaPage() {
  const { roleFetch } = useCafeSession();
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roleFetch("/api/orders?mode=barista");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [roleFetch]);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 8000);
    return () => clearInterval(timer);
  }, [loadQueue]);

  const advanceOrder = async (orderId: string, nextStatus: PrepStatus) => {
    setBusyId(orderId);
    try {
      const res = await roleFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", prepStatus: nextStatus }),
      });
      if (res.ok) {
        await loadQueue();
      }
    } finally {
      setBusyId(null);
    }
  };

  const waitingOrders = orders.filter((o) => o.prepStatus === "ChoPha");
  const brewingOrders = orders.filter((o) => o.prepStatus === "DangPha");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
            Màn hình Quầy Pha Chế
          </h1>
          <p className="text-sm text-[#786254]">
            Phiếu mới từ thu ngân chuyển sang sẽ xếp theo thứ tự gọi trước làm trước.
          </p>
        </div>
        <button
          type="button"
          onClick={loadQueue}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F2E9DF] hover:bg-[#E5D7C8] text-sm font-semibold text-[#5C4638] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới phiếu ({orders.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Column 1: Newly Received (ChoPha) */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-[#2D1E17] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B86B1F]" />
              Phiếu mới chờ pha ({waitingOrders.length})
            </h2>
          </div>

          {waitingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E6D9CB] p-8 text-center text-sm text-[#786254]">
              Hiện không có phiếu mới nào đang đợi.
            </div>
          ) : (
            waitingOrders.map((ord) => (
              <BaristaTicketCard
                key={ord.id}
                order={ord}
                busy={busyId === ord.id}
                actionLabel="Nhận pha đơn này"
                actionTone="bg-[#8C5A3C] hover:bg-[#73472D]"
                onAction={() => advanceOrder(ord.id, "DangPha")}
              />
            ))
          )}
        </section>

        {/* Column 2: Currently Brewing (DangPha) */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-[#2D1E17] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2F6B4F]" />
              Đang pha trên quầy ({brewingOrders.length})
            </h2>
          </div>

          {brewingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E6D9CB] p-8 text-center text-sm text-[#786254]">
              Chưa có đơn nào đang pha dở.
            </div>
          ) : (
            brewingOrders.map((ord) => (
              <BaristaTicketCard
                key={ord.id}
                order={ord}
                busy={busyId === ord.id}
                actionLabel="Đã pha xong — Báo thu ngân"
                actionTone="bg-[#2F6B4F] hover:bg-[#23543D]"
                onAction={() => advanceOrder(ord.id, "DaXong")}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function BaristaTicketCard({
  order,
  busy,
  actionLabel,
  actionTone,
  onAction,
}: {
  order: CafeOrder;
  busy: boolean;
  actionLabel: string;
  actionTone: string;
  onAction: () => void;
}) {
  const mins = minutesElapsed(order.createdAt);

  return (
    <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#EFE6DC] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-xl bg-[#2D1E17] text-white font-bold text-base">
            {order.orderNumber}
          </span>
          <span className="font-bold text-base text-[#8C5A3C]">
            {order.orderType === "TaiBan" ? order.tableName : "Đóng ly Mang đi"}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#786254]">
          <Clock className="w-3.5 h-3.5" />
          {formatTimeVN(order.createdAt)} ({mins === 0 ? "vừa gọi" : `${mins} phút trước`})
        </span>
      </div>

      {/* Large Legible Drink Lines */}
      <div className="space-y-3">
        {order.items.map((item, idx) => {
          const sugarLabel = item.sugarLevel
            ? SUGAR_OPTIONS.find((s) => s.value === item.sugarLevel)?.label
            : null;
          const iceLabel = item.iceLevel
            ? ICE_OPTIONS.find((i) => i.value === item.iceLevel)?.label
            : null;
          const isHot = item.iceLevel === "Nong";

          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#FAF6F1] border border-[#E5D8C9] space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-bold text-[#2D1E17] flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#8C5A3C] text-white text-sm font-bold">
                    {item.quantity}x
                  </span>
                  <span>{item.menuItemName}</span>
                </div>
                {item.cupSize && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#EFE6DC] text-[#5C4638] text-xs font-bold">
                    Cỡ {item.cupSize}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pl-9">
                {sugarLabel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DFD1C1] text-xs font-semibold text-[#5C4638]">
                    {sugarLabel}
                  </span>
                )}
                {iceLabel && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                      isHot
                        ? "bg-[#FCEBE8] text-[#9E3526] border border-[#ECC1BA]"
                        : "bg-white border border-[#DFD1C1] text-[#5C4638]"
                    }`}
                  >
                    {isHot && <Flame className="w-3 h-3" />}
                    {iceLabel}
                  </span>
                )}
                {item.toppingsText && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FDF3E3] border border-[#EED3AC] text-xs font-semibold text-[#9A5212]">
                    + {item.toppingsText}
                  </span>
                )}
              </div>

              {item.itemNote && (
                <div className="pl-9 text-xs font-semibold text-[#8C5A3C]">
                  Lưu ý khách dặn: “{item.itemNote}”
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={onAction}
        className={`w-full py-3.5 px-5 rounded-2xl text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${actionTone}`}
      >
        {order.prepStatus === "ChoPha" ? (
          <CupSoda className="w-4 h-4" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        {actionLabel}
      </button>
    </div>
  );
}
