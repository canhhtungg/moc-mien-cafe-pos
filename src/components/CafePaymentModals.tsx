"use client";

import React from "react";
import { CheckCircle2, Printer, Wifi, X } from "lucide-react";
import { formatDateTimeVN, formatVND, ICE_OPTIONS, SUGAR_OPTIONS } from "@/lib/format";
import type { CafeOrder } from "@/types/cafe";

export interface QRModalData {
  qrDataUrl: string;
  bankShortName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
}

export function CafeVietQRModal({
  qr,
  submitting,
  onClose,
  onConfirmPaid,
}: {
  qr: QRModalData;
  submitting: boolean;
  onClose: () => void;
  onConfirmPaid: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#2D1E17]/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9CB] w-full max-w-md p-6 space-y-5 shadow-xl text-center">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="font-serif-cafe text-xl font-semibold text-[#2D1E17]">
              Mời khách quét mã VietQR
            </h2>
            <p className="text-xs text-[#786254]">
              Số tiền đã được điền sẵn tự động, khách không cần nhập tay
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F2E9DF] text-[#5C4638] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="inline-block p-4 rounded-3xl bg-white border-2 border-[#8C5A3C]/30 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.qrDataUrl}
            alt="Mã thanh toán VietQR quán cafe"
            className="w-56 h-56 object-contain mx-auto"
          />
        </div>

        <div className="bg-[#F7F1EA] rounded-2xl p-4 text-sm space-y-1.5 text-left border border-[#E6D9CB]">
          <div className="flex justify-between">
            <span className="text-[#786254]">Cần thanh toán:</span>
            <strong className="text-lg text-[#8C5A3C] tabular-nums">{formatVND(qr.amount)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#786254]">Ngân hàng:</span>
            <strong className="text-[#2D1E17]">{qr.bankShortName} — {qr.accountNo}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#786254]">Chủ tài khoản:</span>
            <strong className="text-[#2D1E17]">{qr.accountName}</strong>
          </div>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={onConfirmPaid}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#2F6B4F] hover:bg-[#24553E] disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          {submitting ? "Đang gửi sang quầy pha chế..." : "Khách đã chuyển khoản xong"}
        </button>
      </div>
    </div>
  );
}

export function CafeReceiptModal({
  order,
  shopInfo,
  onClose,
}: {
  order: CafeOrder;
  shopInfo: {
    shopName: string;
    address: string;
    wifiName: string;
    wifiPassword: string;
    receiptFooter: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#2D1E17]/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9CB] w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2F6B4F] font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Đã chuyển phiếu sang quầy pha chế!
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#F2E9DF] text-[#5C4638] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket */}
        <div
          id="printable-cafe-receipt"
          className="bg-white rounded-2xl border border-[#E5D8C9] p-5 text-xs text-[#2D1E17] space-y-3"
        >
          <div className="text-center border-b border-dashed border-[#D8C7B5] pb-3">
            <div className="font-serif-cafe text-lg font-semibold">{shopInfo.shopName}</div>
            <div className="text-[#786254]">{shopInfo.address}</div>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#F2E9DF] font-bold text-sm">
              Số phiếu: {order.orderNumber} —{" "}
              {order.orderType === "TaiBan" ? order.tableName : "Mua mang đi"}
            </div>
            <div className="text-[#786254] mt-1">
              {formatDateTimeVN(order.createdAt)} • Thu ngân: {order.staffName}
            </div>
          </div>

          <div className="space-y-2 border-b border-dashed border-[#D8C7B5] pb-3">
            {order.items.map((it, idx) => {
              const sugarTxt = it.sugarLevel
                ? SUGAR_OPTIONS.find((s) => s.value === it.sugarLevel)?.label
                : null;
              const iceTxt = it.iceLevel
                ? ICE_OPTIONS.find((i) => i.value === it.iceLevel)?.label
                : null;
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>
                      {it.quantity}x {it.menuItemName} {it.cupSize ? `(${it.cupSize})` : ""}
                    </span>
                    <span className="tabular-nums">{formatVND(it.lineTotal)}</span>
                  </div>
                  {(sugarTxt || iceTxt || it.toppingsText || it.itemNote) && (
                    <div className="text-[#786254] pl-3">
                      {[sugarTxt, iceTxt, it.toppingsText, it.itemNote]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-1 text-sm">
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[#2F6B4F]">
                <span>Ưu đãi khách thân thiết:</span>
                <span className="tabular-nums">-{formatVND(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Tổng thanh toán:</span>
              <span className="tabular-nums">{formatVND(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#786254]">
              <span>Hình thức:</span>
              <span>
                {order.paymentMethod === "VietQR" ? "Chuyển khoản VietQR" : "Tiền mặt"}
              </span>
            </div>
            {order.paymentMethod === "TienMat" && order.cashReceived !== null && (
              <div className="flex justify-between text-xs text-[#786254]">
                <span>Khách đưa {formatVND(order.cashReceived)} — Tiền thừa:</span>
                <strong className="text-[#2D1E17] tabular-nums">
                  {formatVND(order.changeAmount ?? 0)}
                </strong>
              </div>
            )}
          </div>

          {shopInfo.wifiName && (
            <div className="pt-2 border-t border-dashed border-[#D8C7B5] text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 font-semibold text-[#5C4638]">
                <Wifi className="w-3.5 h-3.5" />
                Wifi: {shopInfo.wifiName} / Mật khẩu: {shopInfo.wifiPassword}
              </div>
              <div className="text-[#786254] italic">{shopInfo.receiptFooter}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 rounded-2xl border border-[#D8C7B5] bg-white hover:bg-[#F7F1EA] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In phiếu
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#8C5A3C] hover:bg-[#73472D] text-white text-sm font-semibold cursor-pointer"
          >
            Gọi đơn mới
          </button>
        </div>
      </div>
    </div>
  );
}
