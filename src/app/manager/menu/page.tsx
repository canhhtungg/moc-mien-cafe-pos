"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  Plus,
  PlusCircle,
} from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import {
  CATEGORY_LABELS,
  formatThousandDigits,
  formatVND,
  parseThousandDigits,
} from "@/lib/format";
import type { CategoryId, Ingredient, MenuItem } from "@/types/cafe";

const QUICK_PRICE_PRESETS = [25000, 29000, 35000, 39000, 45000];
const QUICK_UNIT_PRESETS = ["hộp 1L", "kg", "lon", "hộp", "gói 500g", "chai 750ml", "lốc 50 ly"];

export default function ManagerMenuPage() {
  const { roleFetch, refreshBootstrap } = useCafeSession();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Form state for adding or editing a menu item
  const [editingId, setEditingId] = useState<string>("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("CaPhe");
  const [basePriceDisplay, setBasePriceDisplay] = useState("35.000");
  const [description, setDescription] = useState("");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Form state for adding a new ingredient type
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("hộp 1L");
  const [newIngCurrentStock, setNewIngCurrentStock] = useState("5");
  const [newIngMinStock, setNewIngMinStock] = useState("3");

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

  // Luôn đảm bảo các nguyên liệu sắp hết (currentStock <= minStock) được đẩy lên ưu tiên đầu danh sách
  const prioritizedIngredients = useMemo(() => {
    return [...ingredients].sort((a, b) => {
      const aLow = a.currentStock <= a.minStock ? 0 : 1;
      const bLow = b.currentStock <= b.minStock ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      const aDiff = a.currentStock - a.minStock;
      const bDiff = b.currentStock - b.minStock;
      if (aDiff !== bDiff) return aDiff - bDiff;
      return a.name.localeCompare(b.name, "vi");
    });
  }, [ingredients]);

  const lowStockCount = useMemo(
    () => prioritizedIngredients.filter((i) => i.currentStock <= i.minStock).length,
    [prioritizedIngredients]
  );

  const selectForEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setBasePriceDisplay(formatThousandDigits(item.basePrice));
    setDescription(item.description);
    setIsBestSeller(item.isBestSeller);
    setIsAvailable(item.isAvailable);
  };

  const resetForm = () => {
    setEditingId("");
    setName("");
    setCategory("CaPhe");
    setBasePriceDisplay("35.000");
    setDescription("");
    setIsBestSeller(false);
    setIsAvailable(true);
  };

  const handlePriceInputChange = (rawValue: string) => {
    const formatted = formatThousandDigits(rawValue);
    setBasePriceDisplay(formatted);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseThousandDigits(basePriceDisplay);
    const isPastry = category === "BanhNgot";
    const res = await roleFetch("/api/manager/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId || undefined,
        name,
        category,
        description,
        basePrice: numericPrice,
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
          ? `Đã cập nhật món "${name}" (${formatVND(numericPrice)}) thành công!`
          : `Đã thêm món mới "${name}" (${formatVND(numericPrice)}) vào thực đơn quán!`
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

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;
    const res = await roleFetch("/api/bar-stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "create-ingredient",
        name: newIngName.trim(),
        unit: newIngUnit.trim() || "hộp",
        currentStock: Number(newIngCurrentStock) || 0,
        minStock: Number(newIngMinStock) || 2,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setIngredients(data.ingredients ?? []);
      setBanner(`Đã thêm nguyên liệu mới "${newIngName.trim()}" vào danh sách kho!`);
      setNewIngName("");
      setNewIngCurrentStock("5");
      setNewIngMinStock("3");
      setShowAddIngredient(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5">
        <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
          Quản lý Thực đơn &amp; Nhập thêm nguyên liệu
        </h1>
        <p className="text-sm text-[#786254]">
          Thêm món mới (giá tự phân cách 3 chữ số), đổi giá bán hoặc nhập kho nguyên liệu ưu tiên mặt hàng sắp hết.
        </p>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-[#E6F2EC] border border-[#BBDACB] text-sm text-[#23583E] font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{banner}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs underline cursor-pointer shrink-0"
          >
            Đóng
          </button>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="text-xs font-semibold text-[#5C4638]">
                Giá bán (tự tách 3 chữ số)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={basePriceDisplay}
                  onChange={(e) => handlePriceInputChange(e.target.value)}
                  placeholder="35.000"
                  className="w-full rounded-2xl border border-[#E5D8C9] pl-3.5 pr-9 py-2.5 text-sm font-bold text-[#2D1E17] tabular-nums"
                />
                <span className=" -translate-y-1/2 text-xs font-bold text-[#8C5A3C] absolute right-3.5 top-1/2 pointer-events-none">
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Quick 1-Tap Price Chips */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#786254]">Chọn nhanh mức giá phổ biến:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRICE_PRESETS.map((preset) => {
                const formattedPreset = formatThousandDigits(preset);
                const isSelected = basePriceDisplay === formattedPreset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBasePriceDisplay(formattedPreset)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#8C5A3C] text-white border-[#8C5A3C]"
                        : "bg-[#FAF6F1] text-[#5C4638] border-[#E5D8C9] hover:bg-[#F2E9DF]"
                    }`}
                  >
                    {formattedPreset}đ
                  </button>
                );
              })}
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

        {/* Right: Existing Menu List + Prioritized Ingredient Restock & Add New Ingredient */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-3">
            <h2 className="text-base font-bold text-[#2D1E17]">
              Danh sách món hiện tại (chạm vào món để sửa giá)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
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

          {/* Warehouse Ingredients with Priority Sorting + Distinct Colors + Add New Ingredient */}
          <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-[#2D1E17]">
                    Kho nguyên liệu &amp; Nhập hàng
                  </h2>
                  {lowStockCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FCEBE8] border border-[#E8B4A6] text-xs font-bold text-[#A63A22]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {lowStockCount} mặt hàng sắp hết được ưu tiên lên đầu
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#786254] mt-0.5">
                  Nguyên liệu chạm mức tối thiểu sẽ đổi màu cam/đỏ và tự động đẩy lên trên cùng để nhập trước.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddIngredient((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#F2E9DF] hover:bg-[#E6D8C8] text-xs font-bold text-[#5C4638] cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                {showAddIngredient ? "Đóng khung thêm" : "Thêm loại nguyên liệu mới"}
              </button>
            </div>

            {/* Expandable Form to Add a New Ingredient Type */}
            {showAddIngredient && (
              <form
                onSubmit={handleCreateIngredient}
                className="p-4 rounded-2xl bg-[#FAF6F1] border-2 border-dashed border-[#C8A98E] space-y-3"
              >
                <div className="text-xs font-bold text-[#5C4638]">
                  Thêm mặt hàng nguyên liệu mới vào kho quản lý
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5C4638]">
                      Tên nguyên liệu mới
                    </label>
                    <input
                      type="text"
                      required
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      placeholder="VD: Kem béo thực vật Rich's, Siro Vải..."
                      className="w-full rounded-xl border border-[#DFD1C1] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5C4638]">
                      Đơn vị tính (chọn hoặc tự gõ)
                    </label>
                    <input
                      type="text"
                      required
                      value={newIngUnit}
                      onChange={(e) => setNewIngUnit(e.target.value)}
                      placeholder="VD: hộp 1L, kg, chai, gói..."
                      className="w-full rounded-xl border border-[#DFD1C1] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-[#786254]">Đơn vị gợi ý:</span>
                  {QUICK_UNIT_PRESETS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setNewIngUnit(u)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        newIngUnit === u
                          ? "bg-[#8C5A3C] text-white border-[#8C5A3C]"
                          : "bg-white text-[#5C4638] border-[#DFD1C1]"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5C4638]">
                      Số lượng nhập ban đầu
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      required
                      value={newIngCurrentStock}
                      onChange={(e) => setNewIngCurrentStock(e.target.value)}
                      className="w-full rounded-xl border border-[#DFD1C1] bg-white px-3 py-2 text-sm tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5C4638]">
                      Mức báo sắp hết (tối thiểu)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step="0.5"
                      required
                      value={newIngMinStock}
                      onChange={(e) => setNewIngMinStock(e.target.value)}
                      className="w-full rounded-xl border border-[#DFD1C1] bg-white px-3 py-2 text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddIngredient(false)}
                    className="px-3.5 py-2 rounded-xl border border-[#D8C6B4] bg-white text-xs font-semibold text-[#5C4638] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2F6B4F] hover:bg-[#24553E] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Lưu nguyên liệu mới
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {prioritizedIngredients.map((ing) => {
                const isLow = ing.currentStock <= ing.minStock;
                return (
                  <div
                    key={ing.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                      isLow
                        ? "bg-[#FDF2EA] border-2 border-[#E08E55] shadow-2xs"
                        : "bg-[#FAF6F1] border border-[#E5D8C9]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#2D1E17]">{ing.name}</span>
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C85A32] text-white text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Sắp hết • Ưu tiên nhập trước
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E6F2EC] text-[#23583E] text-[11px] font-semibold">
                            Đủ dùng
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#786254]">
                        Đang còn:{" "}
                        <strong
                          className={`tabular-nums ${
                            isLow ? "text-[#B8431E] text-sm" : "text-[#2D1E17]"
                          }`}
                        >
                          {ing.currentStock} {ing.unit}
                        </strong>{" "}
                        (Ước tính pha được{" "}
                        <strong className="text-[#8C5A3C]">
                          ~{ing.estimatedCupsRemaining ?? 20} cốc
                        </strong>
                        ) • An toàn: {ing.minStock} {ing.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestockIngredient(ing, 1)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E9DF] border border-[#D8C6B4] text-xs font-semibold text-[#5C4638] cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestockIngredient(ing, 5)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold cursor-pointer ${
                          isLow
                            ? "bg-[#C85A32] hover:bg-[#A94622]"
                            : "bg-[#8C5A3C] hover:bg-[#73472D]"
                        }`}
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        Nhập +5 {ing.unit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestockIngredient(ing, 10)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E9DF] border border-[#D8C6B4] text-xs font-semibold text-[#5C4638] cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
