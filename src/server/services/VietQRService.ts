import QRCode from "qrcode";
import { ensureCafeDbReady, getDbClient } from "@/server/db/client";

export const VIETNAMESE_BANKS: Array<{ bin: string; shortName: string; fullName: string }> = [
  { bin: "970422", shortName: "MB Bank", fullName: "Ngân hàng Quân Đội (MB)" },
  { bin: "970436", shortName: "Vietcombank", fullName: "Ngân hàng Ngoại thương Việt Nam" },
  { bin: "970407", shortName: "Techcombank", fullName: "Ngân hàng Kỹ thương Việt Nam" },
  { bin: "970415", shortName: "VietinBank", fullName: "Ngân hàng Công thương Việt Nam" },
  { bin: "970418", shortName: "BIDV", fullName: "Ngân hàng Đầu tư và Phát triển VN" },
  { bin: "970416", shortName: "ACB", fullName: "Ngân hàng Á Châu" },
  { bin: "970423", shortName: "TPBank", fullName: "Ngân hàng Tiên Phong" },
];

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

export function sanitizeVietQRNote(raw: string): string {
  const ascii = raw
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (ascii || "LANGCAFE").slice(0, 25);
}

export class VietQRService {
  computeCRC16(input: string): string {
    let crc = 0xffff;
    for (let i = 0; i < input.length; i++) {
      crc ^= input.charCodeAt(i) << 8;
      for (let bit = 0; bit < 8; bit++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  buildPayload(params: {
    bin: string;
    accountNo: string;
    amount: number;
    note: string;
  }): string {
    const cleanBin = params.bin.replace(/\D/g, "");
    const cleanAcc = params.accountNo.replace(/[^a-zA-Z0-9]/g, "");
    const intAmount = Math.max(0, Math.round(params.amount));
    const addInfo = sanitizeVietQRNote(params.note);

    const beneficiaryOrg = tlv("00", cleanBin) + tlv("01", cleanAcc);
    const napasMerchantInfo =
      tlv("00", "A000000727") + tlv("01", beneficiaryOrg) + tlv("02", "QRIBFTTA");

    const parts: string[] = [
      tlv("00", "01"),
      tlv("01", intAmount > 0 ? "12" : "11"),
      tlv("38", napasMerchantInfo),
      tlv("53", "704"),
    ];
    if (intAmount > 0) {
      parts.push(tlv("54", String(intAmount)));
    }
    parts.push(tlv("58", "VN"));
    parts.push(tlv("62", tlv("08", addInfo)));

    const withoutCrc = parts.join("") + "6304";
    return withoutCrc + this.computeCRC16(withoutCrc);
  }

  async generateCafeQR(params: {
    amount: number;
    note: string;
    overrideBin?: string;
    overrideAccountNo?: string;
    overrideAccountName?: string;
    overrideBankShortName?: string;
  }) {
    await ensureCafeDbReady();
    const db = getDbClient();
    const rows = await db.execute("SELECT key, value FROM cafe_settings");
    const map = new Map<string, string>();
    for (const r of rows.rows) {
      map.set(String(r.key), String(r.value));
    }

    const bankBin = params.overrideBin ?? map.get("bankBin") ?? "970422";
    const bankShortName = params.overrideBankShortName ?? map.get("bankShortName") ?? "MB Bank";
    const accountNo = params.overrideAccountNo ?? map.get("bankAccountNo") ?? "0336606699";
    const accountName = params.overrideAccountName ?? map.get("bankAccountName") ?? "TO CANH TUNG";
    const amount = Math.max(0, Math.round(params.amount));
    const addInfo = sanitizeVietQRNote(params.note);

    const payload = this.buildPayload({
      bin: bankBin,
      accountNo,
      amount,
      note: params.note,
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: {
        dark: "#3B2314",
        light: "#FFFFFF",
      },
    });

    return {
      payload,
      qrDataUrl,
      bankBin,
      bankShortName,
      accountNo,
      accountName,
      amount,
      addInfo,
    };
  }
}
