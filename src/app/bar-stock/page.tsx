"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Minus, Plus } from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { CATEGORY_LABELS } from "@/lib/format";
import type { Ingredient, MenuItem } from "@/types/cafe";

export default function BarStockPage() {
  const { roleFetch, refreshBootstrap } = useCafeSession();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  const loadBarStock = useCallback(async () => {
    const res = await roleFetch("/api/bar-stock");
    if (res.ok) {
      const data = await res.json();
      setMenu(data.menu ?? []);
      setIngredients(data.ingredients ?? []);
    }
  }, [roleFetch]);

  useEffect(() => {
    loadBarStock();
  }, [loadBarStock]);

  const handleToggleDrink = async (item: MenuItem) => {
    const nextState = !item.isAvailable;
    const res = await roleFetch("/api/bar-stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "toggle-menu",
        menuItemId: item.id,
        isAvailable: nextState,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setMenu(data.menu ?? []);
      await refreshBootstrap();
      setBanner(
        nextState
          ? `Đã mở phục vụ lại món "${item.name}" trên màn hình Thu ngân.`
          : `Đã báo tạm hết món "${item.name}" — Thu ngân sẽ không bấm chọn nhầm nữa.`
      );
    }
  };

  const handleAdjustIngredient = async (ing: Ingredient, delta: number) => {
    const res = await roleFetch("/api/bar-stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ingredient-delta",
        ingredientId: ing.id,
        delta,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setIngredients(data.ingredients ?? []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5">
        <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
          Báo hết món nhanh &amp; Nguyên liệu trên quầy
        </h1>
        <p className="text-sm text-[#786254] mt-0.5">
          Khi quầy pha chế hết nguyên liệu làm món nào, bạn chỉ cần gạt nút bên dưới để báo ngay cho màn hình Thu ngân.
        </p>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-[#E6F2EC] border border-[#BBDACB] text-sm text-[#23583E] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Toggle Drink Availability */}
        <section className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <h2 className="text-base font-bold text-[#2D1E17]">
            1. Bật / tắt món đang phục vụ tại quầy
          </h2>
          <div className="divide-y divide-[#F2E9DF]">
            {menu.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-semibold text-sm text-[#2D1E17]">{item.name}</div>
                  <div className="text-xs text-[#786254]">
                    Nhóm: {CATEGORY_LABELS[item.category]}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleDrink(item)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold border transition-colors cursor-pointer ${
                    item.isAvailable
                      ? "bg-[#E6F2EC] text-[#23583E] border-[#BBDACB] hover:bg-[#D5E9DF]"
                      : "bg-[#FCEBE8] text-[#9E3526] border-[#ECC1BA] hover:bg-[#F7DCD7]"
                  }`}
                >
                  {item.isAvailable ? "Đang còn món (Bấm để báo hết)" : "Đang tạm hết (Bấm để mở lại)"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Quick Bar Ingredient Check */}
        <section className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#2D1E17]">
              2. Kiểm đếm nguyên liệu tại quầy bar
            </h2>
            <p className="text-xs text-[#786254]">
              Bấm trừ khi vừa khui hộp/túi mới để Quản lý kịp nhập thêm hàng
            </p>
          </div>

          <div className="space-y-2.5">
            {ingredients.map((ing) => {
              const isLow = ing.currentStock <= ing.minStock;
              return (
                <div
                  key={ing.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLow
                      ? "bg-[#FDF3E3] border-[#EED3AC]"
                      : "bg-[#FAF6F1] border-[#E5D8C9]"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-[#2D1E17]">{ing.name}</div>
                    <div className="text-xs text-[#786254] flex items-center gap-1.5 mt-0.5">
                      <span>
                        Còn lại:{" "}
                        <strong className="text-[#2D1E17] tabular-nums">
                          {ing.currentStock} {ing.unit}
                        </strong>
                      </span>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 text-[#9A5212] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Sắp hết
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustIngredient(ing, -1)}
                      className="w-8 h-8 rounded-xl bg-white border border-[#D8C6B4] flex items-center justify-center hover:bg-[#F2E9DF] cursor-pointer"
                      title="Giảm 1 đơn vị"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustIngredient(ing, 1)}
                      className="w-8 h-8 rounded-xl bg-white border border-[#D8C6B4] flex items-center justify-center hover:bg-[#F2E9DF] cursor-pointer"
                      title="Cộng 1 đơn vị"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
