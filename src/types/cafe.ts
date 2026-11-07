export type StaffRole = "Cashier" | "Barista" | "Manager";

export type CategoryId = "CaPhe" | "TraTraiCay" | "MatchaSua" | "BanhNgot";

export type CupSize = "S" | "M" | "L";
export type SugarLevel = "100" | "70" | "30" | "0";
export type IceLevel = "BinhThuong" | "ItDa" | "DaRieng" | "Nong";

export type OrderType = "TaiBan" | "MangDi";
export type PrepStatus = "ChoPha" | "DangPha" | "DaXong" | "DaGiao" | "DaHuy";
export type PaymentMethod = "TienMat" | "VietQR";
export type TableStatus = "Trong" | "CoKhach";

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  shiftLabel: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  basePrice: number;
  isAvailable: boolean;
  isBestSeller: boolean;
  hasSizeOption: boolean;
  hasTempOption: boolean;
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface CafeTable {
  id: string;
  name: string;
  zone: string;
  seats: number;
  status: TableStatus;
  activeOrderId: string | null;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  updatedAt: string;
}

export interface LoyalCustomer {
  phone: string;
  name: string;
  cupsAccumulated: number;
  freeDrinkVouchers: number;
  totalSpent: number;
}

export interface CafeOrderItem {
  id?: number;
  orderId?: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  cupSize: CupSize | null;
  sugarLevel: SugarLevel | null;
  iceLevel: IceLevel | null;
  toppingsText: string;
  itemNote: string;
  unitPrice: number;
  lineTotal: number;
}

export interface CafeOrder {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  tableId: string | null;
  tableName: string | null;
  staffId: string;
  staffName: string;
  customerPhone: string | null;
  customerName: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived: number | null;
  changeAmount: number | null;
  prepStatus: PrepStatus;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: CafeOrderItem[];
}

export interface CafeSettings {
  shopName: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  receiptFooter: string;
  bankBin: string;
  bankShortName: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export interface RevenueReportDTO {
  totalRevenue: number;
  cashRevenue: number;
  vietqrRevenue: number;
  paidOrdersCount: number;
  cancelledOrdersCount: number;
  totalCupsSold: number;
  averageOrderValue: number;
  lowStockIngredientsCount: number;
  topSellingItems: Array<{
    menuItemId: string;
    menuItemName: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentOrders: CafeOrder[];
}
