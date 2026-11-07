"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, PackagePlus, PlusCircle } from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { CATEGORY_LABELS, formatVND } from "@/lib/format";
import type { CategoryId, Ingredient, MenuItem } from "@/types/cafe";

export default function ManagerMenuPage() {
  const { roleFetch, refreshBootstrap } = useCafeSession();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Form state for adding or editing a menu item
  const [editingId, setEditingId] = useState<string>("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("CaPhe");
  const [basePrice, setBasePrice] = useState("35000");
  const [description, setDescription] = useState("");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const res = await roleFetch("/api/bar-stock");
    if (res.ok) {
      const data = await res.json();
      setMenu(data.menu ?? []);
      setIngredients(data.ingredients ?? []);
    }
  }, [roleFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectForEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setBasePrice(String(item.basePrice));
    setDescription(item.description);
    setIsBestSeller(item.isBestSeller);
    setIsAvailable(item.isAvailable);
  };

  const resetForm = () => {
    setEditingId("");
    setName("");
    setCategory("CaPhe");
    setBasePrice("35000");
    setDescription("");
    setIsBestSeller(false);
    setIsAvailable(true);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPastry = category === "BanhNgot";
    const res = await roleFetch("/api/manager/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId || undefined,
        name,
        category,
        description,
        basePrice: Number(basePrice) || 0,
        isAvailable,
        isBestSeller,
        hasSizeOption: !isPastry,
        hasTempOption: !isPastry,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setMenu(data.menu ?? []);
      await refreshBootstrap();
      setBanner(
        editingId
          ? `Đã cập nhật món "${name}" thành công!`
          : `Đã thêm món mới "${name}" vào thực đơn quán!`
      );
      resetForm();
    }
  };

  const handleRestockIngredient = async (ing: Ingredient, addAmount: number) => {
    const res = await roleFetch("/api/bar-stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ingredient-delta",
        ingredientId: ing.id,
        delta: addAmount,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setIngredients(data.ingredients ?? []);
      setBanner(`Đã nhập thêm +${addAmount} ${ing.unit} "${ing.name}" vào kho.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5">
        <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
          Quản lý Thực đơn &amp; Nhập thêm nguyên liệu
        </h1>
        <p className="text-sm text-[#786254]">
          Thêm món mới, đổi giá bán hoặc nhập thêm sữa, cà phê, ly giấy cho quầy.
        </p>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-[#E6F2EC] border border-[#BBDACB] text-sm text-[#23583E] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Add / Edit Menu Item Form */}
        <form
          onSubmit={handleSaveMenuItem}
          className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2D1E17]">
              {editingId ? "Sửa món đang chọn" : "Thêm món mới vào menu"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#8C5A3C] underline cursor-pointer"
              >
                + Chuyển sang thêm mới
              </button>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#5C4638]">Tên đồ uống / bánh</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Trà Sen Vàng Kem Sữa"
              className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Nhóm món</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full rounded-2xl border border-[#E5D8C9] bg-white px-3 py-2.5 text-sm"
              >
                {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Giá bán (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={1000}
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2.5 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#5C4638]">Mô tả ngắn dễ hiểu</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hương vị, thành phần nổi bật của món..."
              className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-[#5C4638]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded accent-[#8C5A3C]"
              />
              Gắn nhãn “Được thích”
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="rounded accent-[#8C5A3C]"
              />
              Đang còn phục vụ
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-[#8C5A3C] hover:bg-[#73472D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {editingId ? "Lưu thay đổi món này" : "Thêm món vào thực đơn"}
          </button>
        </form>

        {/* Right: Existing Menu List + Ingredient Restock */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-3">
            <h2 className="text-base font-bold text-[#2D1E17]">
              Danh sách món hiện tại (chạm vào món để sửa giá)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {menu.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectForEdit(item)}
                  className="p-3 rounded-2xl border border-[#E5D8C9] hover:border-[#8C5A3C] bg-[#FAF6F1] text-left flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#2D1E17] truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-[#786254]">
                      {CATEGORY_LABELS[item.category]} •{" "}
                      {item.isAvailable ? "Đang bán" : "Tạm hết"}
                    </div>
                  </div>
                  <span className="font-bold text-sm text-[#8C5A3C] tabular-nums shrink-0">
                    {formatVND(item.basePrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-3">
            <h2 className="text-base font-bold text-[#2D1E17]">
              Nhập thêm nguyên liệu vào kho
            </h2>
            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="p-3 rounded-2xl bg-[#FAF6F1] border border-[#E5D8C9] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-[#2D1E17]">{ing.name}</div>
                    <div className="text-xs text-[#786254]">
                      Đang còn:{" "}
                      <strong className="text-[#2D1E17]">
                        {ing.currentStock} {ing.unit}
                      </strong>{" "}
                      (Mức an toàn: {ing.minStock} {ing.unit})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestockIngredient(ing, 5)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C5A3C] hover:bg-[#73472D] text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    Nhập +5 {ing.unit}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
