"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Coffee, RefreshCw, Sparkles, Users } from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { formatTimeVN, PREP_STATUS_META } from "@/lib/format";
import type { CafeOrder } from "@/types/cafe";

export default function TablesPage() {
  const { tables, refreshBootstrap, applyTables, roleFetch } = useCafeSession();
  const [activeOrders, setActiveOrders] = useState<CafeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadShiftStatus = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [ordRes] = await Promise.all([
          roleFetch("/api/orders?mode=active"),
          refreshBootstrap(),
        ]);
        if (ordRes.ok) {
          const data = await ordRes.json();
          setActiveOrders(data.orders ?? []);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [roleFetch, refreshBootstrap]
  );

  useEffect(() => {
    loadShiftStatus(false);
    const timer = setInterval(() => {
      loadShiftStatus(true);
    }, 5000);
    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        loadShiftStatus(true);
      }
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [loadShiftStatus]);

  const handleMarkServed = async (order: CafeOrder) => {
    setBusyId(order.id);
    // Cập nhật giao diện tức thì ngay khi bấm
    setActiveOrders((prev) => prev.filter((o) => o.id !== order.id));
    setNotice(`Đã giao nước xong cho phiếu ${order.orderNumber}!`);

    try {
      const res = await roleFetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", prepStatus: "DaGiao" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activeOrders)) {
          setActiveOrders(data.activeOrders);
        }
        if (Array.isArray(data.tables)) {
          applyTables(data.tables);
        }
      } else {
        await loadShiftStatus(true);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleClearTable = async (tableId: string, tableName: string) => {
    setBusyId(tableId);
    // Cập nhật trạng thái bàn trống và dọn luôn đơn gắn với bàn đó trên UI tức thì
    applyTables(
      tables.map((t) =>
        t.id === tableId ? { ...t, status: "Trong", activeOrderId: null } : t
      )
    );
    setActiveOrders((prev) => prev.filter((o) => o.tableId !== tableId));
    setNotice(`${tableName} đã được dọn sạch và chuyển về trạng thái Bàn trống.`);

    try {
      const res = await roleFetch(`/api/tables/${encodeURIComponent(tableId)}/clear`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tables)) {
          applyTables(data.tables);
        }
        if (Array.isArray(data.activeOrders)) {
          setActiveOrders(data.activeOrders);
        }
      } else {
        await loadShiftStatus(true);
      }
    } finally {
      setBusyId(null);
    }
  };

  const zones = Array.from(new Set(tables.map((t) => t.zone)));
  const emptyCount = tables.filter((t) => t.status === "Trong").length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
            Sơ đồ bàn &amp; Nước chờ mang ra khách
          </h1>
          <p className="text-sm text-[#786254]">
            Hiện còn <strong className="text-[#2F6B4F]">{emptyCount}/{tables.length} bàn trống</strong> sẵn sàng đón khách • Tự động đồng bộ mỗi 5 giây.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadShiftStatus(false)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F2E9DF] hover:bg-[#E6D8C8] text-sm font-semibold text-[#5C4638] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Cập nhật ngay
        </button>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-[#E6F2EC] border border-[#BBDACB] text-sm text-[#23583E] font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Drinks Ready to Serve Banner */}
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-[#8C5A3C]" />
          <h2 className="text-base font-bold text-[#2D1E17]">
            Đơn đang thực hiện trong ca ({activeOrders.length})
          </h2>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-6 text-center text-sm text-[#786254]">
            Tất cả các đơn gọi món đều đã phục vụ xong cho khách.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {activeOrders.map((ord) => {
              const meta = PREP_STATUS_META[ord.prepStatus];
              const isReady = ord.prepStatus === "DaXong";
              return (
                <div
                  key={ord.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                    isReady
                      ? "bg-[#F3FAF6] border-[#9ED0B7]"
                      : "bg-[#FAF6F1] border-[#E5D8C9]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-[#2D1E17]">
                        {ord.orderNumber} •{" "}
                        {ord.orderType === "TaiBan" ? ord.tableName : "Mang đi"}
                      </span>
                      <span className="text-xs text-[#786254]">{formatTimeVN(ord.createdAt)}</span>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.toneClass}`}
                    >
                      {meta.label}
                    </span>
                    <ul className="text-sm text-[#2D1E17] space-y-1 pt-1">
                      {ord.items.map((it, i) => (
                        <li key={i}>
                          <strong>{it.quantity}x</strong> {it.menuItemName}{" "}
                          {it.cupSize ? `(${it.cupSize})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isReady && (
                    <button
                      type="button"
                      disabled={busyId === ord.id}
                      onClick={() => handleMarkServed(ord)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#2F6B4F] hover:bg-[#24553E] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Đã mang nước ra cho khách
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 12 Tables Grouped by Cozy Cafe Zones */}
      <div className="space-y-5">
        {zones.map((zone) => (
          <div key={zone} className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-3">
            <h2 className="font-serif-cafe text-lg font-semibold text-[#2D1E17] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8C5A3C]" />
              Khu vực: {zone}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {tables
                .filter((t) => t.zone === zone)
                .map((table) => {
                  const occupied = table.status === "CoKhach";
                  return (
                    <div
                      key={table.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                        occupied
                          ? "bg-[#FDF6EC] border-[#E7C99E]"
                          : "bg-[#FAF6F1] border-[#E5D8C9]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-base text-[#2D1E17]">{table.name}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-[#786254]">
                            <Users className="w-3.5 h-3.5" />
                            {table.seats} ghế
                          </span>
                        </div>
                        <div
                          className={`text-xs font-semibold mt-1 ${
                            occupied ? "text-[#9A5212]" : "text-[#2F6B4F]"
                          }`}
                        >
                          {occupied ? "Đang có khách ngồi" : "Bàn trống"}
                        </div>
                      </div>

                      {occupied && (
                        <button
                          type="button"
                          disabled={busyId === table.id}
                          onClick={() => handleClearTable(table.id, table.name)}
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F2E9DF] disabled:opacity-60 border border-[#D8C2A8] text-xs font-semibold text-[#5C4638] cursor-pointer"
                        >
                          Khách đã về — Dọn bàn
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
