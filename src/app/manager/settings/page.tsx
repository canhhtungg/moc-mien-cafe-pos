"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Save } from "lucide-react";
import { useCafeSession } from "@/context/CafeSessionContext";
import { formatVND } from "@/lib/format";
import type { CafeSettings } from "@/types/cafe";

interface BankItem {
  bin: string;
  shortName: string;
  fullName: string;
}

export default function ManagerSettingsPage() {
  const { roleFetch, refreshBootstrap } = useCafeSession();
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [form, setForm] = useState<CafeSettings>({
    shopName: "Lặng. Café",
    address: "28 Ngõ Nhỏ Phố Cổ, Hoàn Kiếm, Hà Nội",
    wifiName: "Lang_Cafe",
    wifiPassword: "henmotngayvui",
    receiptFooter: "Một khoảng lặng thơm mùi cà phê mới rang. Cảm ơn bạn đã ghé Lặng hôm nay!",
    bankBin: "970422",
    bankShortName: "MB Bank",
    bankAccountNo: "0336606699",
    bankAccountName: "TO CANH TUNG",
  });
  const [qrUrl, setQrUrl] = useState<string>("");
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPreview = useCallback(
    async (cfg: CafeSettings) => {
      const res = await roleFetch("/api/vietqr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 45000,
          note: "MocMien Thu Nghiem",
          overrideBin: cfg.bankBin,
          overrideAccountNo: cfg.bankAccountNo,
          overrideAccountName: cfg.bankAccountName,
          overrideBankShortName: cfg.bankShortName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrUrl(data.qrDataUrl);
      }
    },
    [roleFetch]
  );

  useEffect(() => {
    (async () => {
      const res = await roleFetch("/api/manager/settings");
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks ?? []);
        if (data.settings) {
          setForm(data.settings);
          await loadPreview(data.settings);
        }
      }
    })();
  }, [roleFetch, loadPreview]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const res = await roleFetch("/api/manager/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(data.settings);
        await refreshBootstrap();
        await loadPreview(data.settings);
        setBanner("Đã lưu thông tin quán và tài khoản nhận tiền VietQR!");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Khôi phục lại toàn bộ thực đơn, bàn và đơn hàng mẫu ban đầu?")) {
      return;
    }
    const res = await roleFetch("/api/manager/settings", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      await refreshBootstrap();
      setBanner(data.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#E6D9CB] p-5">
        <h1 className="font-serif-cafe text-2xl font-semibold text-[#2D1E17]">
          Cài đặt thông tin quán &amp; Tài khoản VietQR
        </h1>
        <p className="text-sm text-[#786254]">
          Thay đổi mật khẩu Wifi in trên hóa đơn và số tài khoản ngân hàng nhận tiền của quán.
        </p>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-[#E6F2EC] border border-[#BBDACB] text-sm text-[#23583E] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D9CB] p-5 space-y-4"
        >
          <h2 className="text-base font-bold text-[#2D1E17]">1. Thông tin in trên phiếu</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Tên quán (gợi ý vibe nghệ)</label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {["Lặng. Café", "Chạm. Café", "Mơ Màng Café", "Thơ. Café", "Khói. Café"].map(
                  (presetName) => (
                    <button
                      key={presetName}
                      type="button"
                      onClick={() => setForm({ ...form, shopName: presetName })}
                      className="px-2 py-0.5 rounded-lg bg-[#FAF6F1] hover:bg-[#F2E9DF] border border-[#E5D8C9] text-[11px] font-semibold text-[#5C4638] cursor-pointer"
                    >
                      {presetName}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Địa chỉ quán</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Tên Wifi cho khách</label>
              <input
                type="text"
                value={form.wifiName}
                onChange={(e) => setForm({ ...form, wifiName: e.target.value })}
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Mật khẩu Wifi</label>
              <input
                type="text"
                value={form.wifiPassword}
                onChange={(e) => setForm({ ...form, wifiPassword: e.target.value })}
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#5C4638]">Lời nhắn cuối hóa đơn</label>
            <input
              type="text"
              value={form.receiptFooter}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
              className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
            />
          </div>

          <h2 className="text-base font-bold text-[#2D1E17] pt-2">
            2. Tài khoản nhận chuyển khoản VietQR
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#5C4638]">Ngân hàng</label>
            <select
              value={form.bankBin}
              onChange={(e) => {
                const bin = e.target.value;
                const found = banks.find((b) => b.bin === bin);
                setForm({
                  ...form,
                  bankBin: bin,
                  bankShortName: found?.shortName ?? form.bankShortName,
                });
              }}
              className="w-full rounded-2xl border border-[#E5D8C9] bg-white px-3.5 py-2.5 text-sm"
            >
              {banks.map((b) => (
                <option key={b.bin} value={b.bin}>
                  {b.shortName} — {b.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Số tài khoản</label>
              <input
                type="text"
                value={form.bankAccountNo}
                onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })}
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C4638]">Tên chủ tài khoản</label>
              <input
                type="text"
                value={form.bankAccountName}
                onChange={(e) =>
                  setForm({ ...form, bankAccountName: e.target.value.toUpperCase() })
                }
                className="w-full rounded-2xl border border-[#E5D8C9] px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-5 rounded-2xl bg-[#8C5A3C] hover:bg-[#73472D] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Đang lưu..." : "Lưu cài đặt quán"}
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              className="py-3 px-4 rounded-2xl bg-[#F2E9DF] hover:bg-[#E6D8C8] text-[#5C4638] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Khôi phục dữ liệu mẫu
            </button>
          </div>
        </form>

        {/* QR Live Preview Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D9CB] p-6 text-center space-y-4">
          <h2 className="font-serif-cafe text-lg font-semibold text-[#2D1E17]">
            Mã VietQR mẫu tại quầy thu ngân
          </h2>
          {qrUrl && (
            <div className="inline-block p-4 rounded-3xl bg-white border border-[#E5D8C9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="VietQR mẫu"
                className="w-52 h-52 object-contain mx-auto"
              />
            </div>
          )}
          <div className="text-xs text-[#786254] space-y-1">
            <div>
              Ngân hàng: <strong className="text-[#2D1E17]">{form.bankShortName}</strong> ({form.bankAccountNo})
            </div>
            <div>
              Chủ TK: <strong className="text-[#2D1E17]">{form.bankAccountName}</strong>
            </div>
            <div>
              Số tiền khóa tự động mẫu: <strong className="text-[#8C5A3C]">{formatVND(45000)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
