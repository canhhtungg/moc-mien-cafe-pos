"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, Minus, Plus, X } from "lucide-react";
import {
  CUP_SIZE_OPTIONS,
  formatVND,
  ICE_OPTIONS,
  SUGAR_OPTIONS,
} from "@/lib/format";
import type {
  CupSize,
  IceLevel,
  MenuItem,
  SugarLevel,
  ToppingOption,
} from "@/types/cafe";

const QUICK_NOTES = ["Ít sữa đặc", "Khuấy đều", "Bỏ túi mang đi", "Không lấy ống hút"];

interface DrinkCustomizeModalProps {
  item: MenuItem;
  toppings: ToppingOption[];
  maxAllowedQuantity: number;
  onClose: () => void;
  onAdd: (configured: {
    menuItem: MenuItem;
    quantity: number;
    cupSize: CupSize | null;
    sugarLevel: SugarLevel | null;
    iceLevel: IceLevel | null;
    toppingIds: string[];
    itemNote: string;
    unitPrice: number;
  }) => void;
}

export function DrinkCustomizeModal({
  item,
  toppings,
  maxAllowedQuantity,
  onClose,
  onAdd,
}: DrinkCustomizeModalProps) {
  const safeCap = Math.max(1, maxAllowedQuantity);
  const [quantity, setQuantity] = useState(1);
  const [cupSize, setCupSize] = useState<CupSize>("S");
  const [sugarLevel, setSugarLevel] = useState<SugarLevel>("70");
  const [iceLevel, setIceLevel] = useState<IceLevel>("BinhThuong");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState("");

  const sizeExtra = item.hasSizeOption
    ? CUP_SIZE_OPTIONS.find((s) => s.value === cupSize)?.extraPrice ?? 0
    : 0;
  const toppingExtra = toppings
    .filter((t) => selectedToppings.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const unitPrice = item.basePrice + sizeExtra + toppingExtra;
  const totalLine = unitPrice * quantity;

  const toggleTopping = (id: string) => {
    setSelectedToppings((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const appendQuickNote = (note: string) => {
    setItemNote((prev) => {
      if (prev.includes(note)) return prev;
      return prev ? `${prev}, ${note}` : note;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D1E17]/40 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9CB] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#EDE2D6] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif-cafe text-xl font-semibold text-[#2D1E17]">
                {item.name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  safeCap <= 10
                    ? "bg-[#FDF2EA] text-[#B8431E] border border-[#E08E55]"
                    : "bg-[#E6F2EC] text-[#23583E]"
                }`}
              >
                Kho còn pha được ~{safeCap} cốc
              </span>
            </div>
            <p className="text-xs text-[#786254]">{item.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng chọn món"
            className="p-2 rounded-xl bg-[#F2E9DF] hover:bg-[#E5D7C8] text-[#5C4638] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Options */}
        <div className="p-5 overflow-y-auto space-y-4">
          {item.hasSizeOption && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-[#2D1E17]">Chọn cỡ ly</div>
              <div className="grid grid-cols-3 gap-2.5">
                {CUP_SIZE_OPTIONS.map((opt) => {
                  const active = cupSize === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCupSize(opt.value)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? "bg-[#8C5A3C] text-white border-[#8C5A3C]"
                          : "bg-white text-[#2D1E17] border-[#E5D8C9] hover:bg-[#F7F1EA]"
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className={`text-xs mt-0.5 tabular-nums ${active ? "text-[#F7EFE6]" : "text-[#786254]"}`}>
                        {opt.extraPrice === 0 ? "Giá gốc" : `+${formatVND(opt.extraPrice)}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {item.hasTempOption && (
            <>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#2D1E17]">Độ ngọt khách muốn</div>
                <div className="grid grid-cols-2 gap-2">
                  {SUGAR_OPTIONS.map((opt) => {
                    const active = sugarLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSugarLevel(opt.value)}
                        className={`py-2.5 px-3.5 rounded-2xl border text-sm font-medium text-left cursor-pointer ${
                          active
                            ? "bg-[#2D1E17] text-white border-[#2D1E17]"
                            : "bg-white text-[#2D1E17] border-[#E5D8C9] hover:bg-[#F7F1EA]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#2D1E17]">Đá hoặc pha nóng</div>
                <div className="grid grid-cols-2 gap-2">
                  {ICE_OPTIONS.map((opt) => {
                    const active = iceLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIceLevel(opt.value)}
                        className={`py-2.5 px-3.5 rounded-2xl border text-sm font-medium text-left cursor-pointer ${
                          active
                            ? "bg-[#2D1E17] text-white border-[#2D1E17]"
                            : "bg-white text-[#2D1E17] border-[#E5D8C9] hover:bg-[#F7F1EA]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {item.category !== "BanhNgot" && toppings.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-[#2D1E17]">Gọi thêm topping (tùy chọn)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {toppings.map((t) => {
                  const checked = selectedToppings.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTopping(t.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-sm cursor-pointer ${
                        checked
                          ? "bg-[#F2E9DF] border-[#8C5A3C] text-[#2D1E17] font-semibold"
                          : "bg-white border-[#E5D8C9] text-[#5C4638] hover:bg-[#FAF6F1]"
                      }`}
                    >
                      <span className="truncate pr-2">{t.name}</span>
                      <span className="inline-flex items-center gap-1 shrink-0 tabular-nums text-xs">
                        +{formatVND(t.price)}
                        {checked && <Check className="w-4 h-4 text-[#8C5A3C]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-semibold text-[#2D1E17]">Dặn thêm quầy pha chế</div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => appendQuickNote(qn)}
                  className="px-2.5 py-1 rounded-full bg-[#F2E9DF] hover:bg-[#E6D8C8] text-xs text-[#5C4638] font-medium cursor-pointer"
                >
                  + {qn}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="Ví dụ: Ít đá, cho thêm giấy ăn..."
              className="w-full rounded-2xl border border-[#E5D8C9] bg-white px-3.5 py-2.5 text-sm text-[#2D1E17]"
            />
          </div>

          {quantity >= safeCap && (
            <div className="p-2.5 rounded-xl bg-[#FDF2EA] border border-[#E08E55] text-xs font-semibold text-[#B8431E] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Đã chạm giới hạn tối đa {safeCap} cốc theo lượng nguyên liệu sẵn có trong kho.</span>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-[#F7F1EA] border-t border-[#E6D9CB] flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-white rounded-2xl border border-[#E5D8C9] p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Giảm số lượng"
              className="w-9 h-9 rounded-xl hover:bg-[#F2E9DF] flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-7 text-center font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              disabled={quantity >= safeCap}
              onClick={() => setQuantity((q) => Math.min(safeCap, q + 1))}
              aria-label="Tăng số lượng"
              className="w-9 h-9 rounded-xl hover:bg-[#F2E9DF] disabled:opacity-35 flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onAdd({
                menuItem: item,
                quantity,
                cupSize: item.hasSizeOption ? cupSize : null,
                sugarLevel: item.hasTempOption ? sugarLevel : null,
                iceLevel: item.hasTempOption ? iceLevel : null,
                toppingIds: selectedToppings,
                itemNote,
                unitPrice,
              })
            }
            className="flex-1 py-3 px-5 rounded-2xl bg-[#8C5A3C] hover:bg-[#73472D] text-white text-sm font-semibold flex items-center justify-between cursor-pointer"
          >
            <span>Thêm vào phiếu ({quantity} cốc)</span>
            <span className="tabular-nums font-bold">{formatVND(totalLine)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
