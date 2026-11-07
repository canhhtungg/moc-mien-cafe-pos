"use client";

import React, { useMemo, useState } from "react";
import {
  Banknote,
  Gift,
  HeartHandshake,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { DrinkCustomizeModal } from "@/components/DrinkCustomizeModal";
import {
  CafeReceiptModal,
  CafeVietQRModal,
  type QRModalData,
} from "@/components/CafePaymentModals";
import {
  CATEGORY_LABELS,
  formatVND,
  ICE_OPTIONS,
  SUGAR_OPTIONS,
} from "@/lib/format";
import type {
  CafeOrder,
  CategoryId,
  CupSize,
  IceLevel,
  LoyalCustomer,
  MenuItem,
  OrderType,
  SugarLevel,
} from "@/types/cafe";

interface CartLine {
  uid: string;
  menuItem: MenuItem;
  quantity: number;
  cupSize: CupSize | null;
  sugarLevel: SugarLevel | null;
  iceLevel: IceLevel | null;
  toppingIds: string[];
  toppingsText: string;
  itemNote: string;
  unitPrice: number;
}

const CASH_BILLS = [50000, 100000, 200000, 500000];

export default function OrderPage() {
  const {
    currentStaff,
    menu,
    toppings,
    tables,
    shopInfo,
    refreshBootstrap,
    roleFetch,
  } = useCafeSession();

  const [selectedCategory, setSelectedCategory] = useState<"ALL" | CategoryId>("ALL");
  const [searchText, setSearchText] = useState("");
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Ticket State
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("TaiBan");
  const [selectedTableId, setSelectedTableId] = useState<string>("B01");

  // Loyal Guest State
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loyalCustomer, setLoyalCustomer] = useState<LoyalCustomer | null>(null);
  const [useFreeVoucher, setUseFreeVoucher] = useState(false);

  // Cash calculation helper
  const [cashGiven, setCashGiven] = useState<number | null>(null);

  // Payment & Receipt Modals
  const [qrModal, setQrModal] = useState<QRModalData | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CafeOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
      if (searchText.trim()) {
        return item.name.toLowerCase().includes(searchText.trim().toLowerCase());
      }
      return true;
    });
  }, [menu, selectedCategory, searchText]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  const discountAmount =
    useFreeVoucher && loyalCustomer && loyalCustomer.freeDrinkVouchers > 0
      ? Math.min(30000, subtotal)
      : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const effectiveCash = cashGiven !== null && cashGiven >= totalAmount ? cashGiven : totalAmount;
  const changeAmount = Math.max(0, effectiveCash - totalAmount);

  const handleTapMenuCard = (item: MenuItem) => {
    if (!item.isAvailable) return;
    // Nếu là bánh ngọt không cần chọn đá/size -> thêm 1 chạm thật nhanh!
    if (!item.hasSizeOption && !item.hasTempOption) {
      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (x) => x.menuItem.id === item.id && !x.itemNote && x.toppingIds.length === 0
        );
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = {
            ...copy[existingIdx],
            quantity: copy[existingIdx].quantity + 1,
          };
          return copy;
        }
        return [
          ...prev,
          {
            uid: `${item.id}-${Date.now()}`,
            menuItem: item,
            quantity: 1,
            cupSize: null,
            sugarLevel: null,
            iceLevel: null,
            toppingIds: [],
            toppingsText: "",
            itemNote: "",
            unitPrice: item.basePrice,
          },
        ];
      });
      return;
    }
    setCustomizingItem(item);
  };

  const handleLookupCustomer = async (phoneValue: string) => {
    setCustomerPhone(phoneValue);
    const digits = phoneValue.replace(/\D/g, "");
    if (digits.length < 9) {
      setLoyalCustomer(null);
      setUseFreeVoucher(false);
      return;
    }
    const res = await roleFetch(`/api/customers?phone=${encodeURIComponent(digits)}`);
    if (res.ok) {
      const data = await res.json();
      setLoyalCustomer(data.customer ?? null);
      if (data.customer) {
        setCustomerName(data.customer.name);
        setUseFreeVoucher(data.customer.freeDrinkVouchers > 0);
      }
    }
  };

  const resetTicket = () => {
    setCart([]);
    setCustomerPhone("");
    setCustomerName("");
    setLoyalCustomer(null);
    setUseFreeVoucher(false);
    setCashGiven(null);
    setQrModal(null);
    setErrorMsg(null);
  };

  const submitOrder = async (paymentMethod: "TienMat" | "VietQR") => {
    if (cart.length === 0) {
      setErrorMsg("Bạn hãy chạm chọn ít nhất 1 món vào phiếu trước nhé.");
      return;
    }
    if (orderType === "TaiBan" && !selectedTableId) {
      setErrorMsg("Vui lòng chọn số bàn cho khách ngồi lại quán.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await roleFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableId: orderType === "TaiBan" ? selectedTableId : null,
          staffId: currentStaff.id,
          staffName: currentStaff.name,
          customerPhone,
          customerName,
          useFreeVoucher,
          paymentMethod,
          cashReceived: paymentMethod === "TienMat" ? effectiveCash : null,
          items: cart.map((c) => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
            cupSize: c.cupSize,
            sugarLevel: c.sugarLevel,
            iceLevel: c.iceLevel,
            toppingIds: c.toppingIds,
            itemNote: c.itemNote,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Không thể lưu đơn hàng.");
      } else {
        setCompletedOrder(data.order);
        resetTicket();
        await refreshBootstrap();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenVietQR = async () => {
    if (cart.length === 0) {
      setErrorMsg("Bạn hãy chạm chọn ít nhất 1 món trước khi tạo mã QR nhé.");
      return;
    }
    setErrorMsg(null);
    const noteLabel =
      orderType === "TaiBan" ? `MocMien ${selectedTableId}` : "MocMien MangDi";
    const res = await roleFetch("/api/vietqr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalAmount, note: noteLabel }),
    });
    const data = await res.json();
    if (res.ok) {
      setQrModal(data);
    } else {
      setErrorMsg(data.error ?? "Không thể tạo mã VietQR.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Simple Visual Menu (7 cols) */}
      <section className="lg:col-span-7 space-y-4">
        {/* Search + Category Pills */}
        <div className="bg-white rounded-3xl border border-[#E6D9CB] p-4 space-y-3 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C5A3C] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm nhanh món khách gọi (ví dụ: bạc xỉu, trà đào, bánh sừng bò...)"
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#FAF6F1] border border-[#E5D8C9] text-sm text-[#2D1E17] placeholder:text-[#9A8475]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold cursor-pointer transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-[#8C5A3C] text-white"
                  : "bg-[#F2E9DF] text-[#5C4638] hover:bg-[#E7DACB]"
              }`}
            >
              Tất cả món
            </button>
            {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#8C5A3C] text-white"
                    : "bg-[#F2E9DF] text-[#5C4638] hover:bg-[#E7DACB]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredMenu.map((item) => {
            const soldOut = !item.isAvailable;
            return (
              <button
                key={item.id}
                type="button"
                disabled={soldOut}
                onClick={() => handleTapMenuCard(item)}
                className={`text-left rounded-3xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                  soldOut
                    ? "bg-[#F3EFEA] border-[#E2D8CE] opacity-65 cursor-not-allowed"
                    : "bg-white border-[#E6D9CB] hover:border-[#8C5A3C] hover:shadow-sm cursor-pointer active:scale-[0.99]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-bold text-[#2D1E17] leading-snug">
                      {item.name}
                    </span>
                    {soldOut ? (
                      <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#FCEBE8] text-[#9E3526] text-xs font-semibold">
                        Tạm hết
                      </span>
                    ) : (
                      item.isBestSeller && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5E9DC] text-[#8C5A3C] text-xs font-semibold">
                          <Sparkles className="w-3 h-3" />
                          Được thích
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-xs text-[#786254] line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F2E9DF]">
                  <span className="text-base font-bold text-[#8C5A3C] tabular-nums">
                    {formatVND(item.basePrice)}
                  </span>
                  <span className="text-xs font-semibold text-[#5C4638] bg-[#FAF6F1] px-3 py-1 rounded-xl border border-[#E6D9CB]">
                    {soldOut
                      ? "Quầy báo hết"
                      : item.hasSizeOption || item.hasTempOption
                        ? "+ Chọn cỡ / đá"
                        : "+ Thêm ngay"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* RIGHT: Tactile Cafe Paper Order Slip (5 cols) */}
      <aside className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-5 shadow-xs space-y-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between border-b border-[#EFE6DC] pb-3">
          <div>
            <h2 className="font-serif-cafe text-xl font-semibold text-[#2D1E17]">
              Phiếu gọi món
            </h2>
            <p className="text-xs text-[#786254]">
              Chạm món bên trái để thêm — gửi thẳng tới màn hình Pha chế
            </p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={resetTicket}
              className="text-xs text-[#9E3526] hover:underline font-medium cursor-pointer"
            >
              Làm mới phiếu
            </button>
          )}
        </div>

        {/* Step 1: Dine-in vs Takeaway */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F2E9DF]">
            <button
              type="button"
              onClick={() => setOrderType("TaiBan")}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                orderType === "TaiBan"
                  ? "bg-white text-[#2D1E17] shadow-2xs"
                  : "text-[#6E5849]"
              }`}
            >
              <Utensils className="w-4 h-4 text-[#8C5A3C]" />
              Ngồi tại quán
            </button>
            <button
              type="button"
              onClick={() => setOrderType("MangDi")}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                orderType === "MangDi"
                  ? "bg-white text-[#2D1E17] shadow-2xs"
                  : "text-[#6E5849]"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#8C5A3C]" />
              Mua mang đi
            </button>
          </div>

          {orderType === "TaiBan" && (
            <div className="grid grid-cols-4 gap-1.5">
              {tables.map((t) => {
                const selected = selectedTableId === t.id;
                const busy = t.status === "CoKhach";
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTableId(t.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selected
                        ? "bg-[#8C5A3C] text-white border-[#8C5A3C]"
                        : busy
                          ? "bg-[#FDF3E3] text-[#9A5212] border-[#EED3AC]"
                          : "bg-[#FAF6F1] text-[#5C4638] border-[#E5D8C9] hover:bg-[#F2E9DF]"
                    }`}
                  >
                    <div>{t.name}</div>
                    <div className="text-[10px] opacity-80">
                      {busy ? "Đang ngồi" : `${t.seats} ghế`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-[#FAF6F1] border border-dashed border-[#DFD2C3] text-sm text-[#786254]">
              Chưa có món nào trên phiếu. Bạn hãy chạm chọn đồ uống hoặc bánh ở bên trái nhé.
            </div>
          ) : (
            cart.map((line) => {
              const sugarTxt = line.sugarLevel
                ? SUGAR_OPTIONS.find((s) => s.value === line.sugarLevel)?.label
                : null;
              const iceTxt = line.iceLevel
                ? ICE_OPTIONS.find((i) => i.value === line.iceLevel)?.label
                : null;
              return (
                <div
                  key={line.uid}
                  className="p-3 rounded-2xl bg-[#FAF6F1] border border-[#E6D9CB] flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-[#2D1E17]">
                      {line.menuItem.name}{" "}
                      {line.cupSize && (
                        <span className="text-xs font-bold text-[#8C5A3C]">
                          (Cỡ {line.cupSize})
                        </span>
                      )}
                    </div>
                    {(sugarTxt || iceTxt || line.toppingsText || line.itemNote) && (
                      <div className="text-xs text-[#786254] mt-0.5">
                        {[sugarTxt, iceTxt, line.toppingsText, line.itemNote]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    )}
                    <div className="text-xs font-bold text-[#8C5A3C] mt-1 tabular-nums">
                      {formatVND(line.unitPrice * line.quantity)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setCart((prev) =>
                          prev
                            .map((x) =>
                              x.uid === line.uid ? { ...x, quantity: x.quantity - 1 } : x
                            )
                            .filter((x) => x.quantity > 0)
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-white border border-[#E5D8C9] flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCart((prev) =>
                          prev.map((x) =>
                            x.uid === line.uid ? { ...x, quantity: x.quantity + 1 } : x
                          )
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-white border border-[#E5D8C9] flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCart((prev) => prev.filter((x) => x.uid !== line.uid))
                      }
                      aria-label="Xóa món"
                      className="w-7 h-7 rounded-lg text-[#9E3526] hover:bg-[#FCEBE8] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Friendly Loyal Customer Stamp Box */}
        <div className="p-3.5 rounded-2xl bg-[#FAF6F1] border border-[#E6D9CB] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C4638]">
            <span className="inline-flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-[#8C5A3C]" />
              Tích điểm khách quen (10 ly tặng 30.000đ)
            </span>
            <button
              type="button"
              onClick={() => handleLookupCustomer("0901234567")}
              className="text-[#8C5A3C] underline cursor-pointer"
            >
              Thử SĐT mẫu
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => handleLookupCustomer(e.target.value)}
              placeholder="SĐT khách (không bắt buộc)"
              className="rounded-xl border border-[#E5D8C9] bg-white px-3 py-2 text-xs text-[#2D1E17]"
            />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách gọi thân mật"
              className="rounded-xl border border-[#E5D8C9] bg-white px-3 py-2 text-xs text-[#2D1E17]"
            />
          </div>

          {loyalCustomer && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#5C4638]">
                Khách quen <strong>{loyalCustomer.name}</strong>: đã tích{" "}
                <strong>{loyalCustomer.cupsAccumulated}/10 ly</strong>
              </span>
              {loyalCustomer.freeDrinkVouchers > 0 && (
                <button
                  type="button"
                  onClick={() => setUseFreeVoucher((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold cursor-pointer ${
                    useFreeVoucher
                      ? "bg-[#2F6B4F] text-white"
                      : "bg-white border border-[#2F6B4F] text-[#2F6B4F]"
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  {useFreeVoucher ? "Đang giảm 30.000đ" : "Dùng phiếu -30k"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Totals & Easy Cash Change Helper */}
        {cart.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-[#EFE6DC]">
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-[#2F6B4F] font-semibold">
                <span>Phiếu tặng khách thân thiết:</span>
                <span className="tabular-nums">-{formatVND(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-[#5C4638]">Tổng cộng cần thu:</span>
              <span className="text-2xl font-bold text-[#2D1E17] tabular-nums">
                {formatVND(totalAmount)}
              </span>
            </div>

            {/* Quick Cash Change Pills (so non-tech cashiers never do mental math) */}
            <div className="space-y-1.5">
              <div className="text-xs text-[#786254]">
                Tính nhanh tiền thừa (nếu khách trả tiền mặt):
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashGiven(totalAmount)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${
                    cashGiven === totalAmount || cashGiven === null
                      ? "bg-[#2D1E17] text-white border-[#2D1E17]"
                      : "bg-[#FAF6F1] text-[#5C4638] border-[#E5D8C9]"
                  }`}
                >
                  Đưa vừa đủ
                </button>
                {CASH_BILLS.filter((b) => b >= totalAmount).map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => setCashGiven(bill)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border tabular-nums cursor-pointer ${
                      cashGiven === bill
                        ? "bg-[#2D1E17] text-white border-[#2D1E17]"
                        : "bg-[#FAF6F1] text-[#5C4638] border-[#E5D8C9]"
                    }`}
                  >
                    {formatVND(bill)}
                  </button>
                ))}
              </div>
              {changeAmount > 0 && (
                <div className="text-xs font-semibold text-[#2F6B4F] bg-[#E6F2EC] px-3 py-1.5 rounded-xl flex justify-between">
                  <span>Tiền thừa trả lại khách:</span>
                  <span className="tabular-nums font-bold">{formatVND(changeAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-[#FCEBE8] text-[#9E3526] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Two Clear, Mistake-Proof Checkout Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={() => submitOrder("TienMat")}
            className="py-3.5 px-4 rounded-2xl bg-[#2D1E17] hover:bg-[#432E24] disabled:opacity-45 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Banknote className="w-4 h-4" />
            Thu tiền mặt
          </button>

          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={handleOpenVietQR}
            className="py-3.5 px-4 rounded-2xl bg-[#8C5A3C] hover:bg-[#73472D] disabled:opacity-45 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Quét mã VietQR
          </button>
        </div>
      </aside>

      {/* Modals */}
      {customizingItem && (
        <DrinkCustomizeModal
          item={customizingItem}
          toppings={toppings}
          onClose={() => setCustomizingItem(null)}
          onAdd={(cfg) => {
            const topNames = toppings
              .filter((t) => cfg.toppingIds.includes(t.id))
              .map((t) => t.name)
              .join(", ");
            setCart((prev) => [
              ...prev,
              {
                uid: `${cfg.menuItem.id}-${Date.now()}`,
                menuItem: cfg.menuItem,
                quantity: cfg.quantity,
                cupSize: cfg.cupSize,
                sugarLevel: cfg.sugarLevel,
                iceLevel: cfg.iceLevel,
                toppingIds: cfg.toppingIds,
                toppingsText: topNames,
                itemNote: cfg.itemNote,
                unitPrice: cfg.unitPrice,
              },
            ]);
            setCustomizingItem(null);
          }}
        />
      )}

      {qrModal && (
        <CafeVietQRModal
          qr={qrModal}
          submitting={submitting}
          onClose={() => setQrModal(null)}
          onConfirmPaid={() => submitOrder("VietQR")}
        />
      )}

      {completedOrder && (
        <CafeReceiptModal
          order={completedOrder}
          shopInfo={shopInfo}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
