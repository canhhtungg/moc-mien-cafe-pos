export const CAFE_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS cafe_staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Cashier', 'Barista', 'Manager')),
    shift_label TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_menu (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('CaPhe', 'TraTraiCay', 'MatchaSua', 'BanhNgot')),
    description TEXT NOT NULL DEFAULT '',
    base_price INTEGER NOT NULL CHECK (base_price >= 0),
    is_available INTEGER NOT NULL DEFAULT 1,
    is_best_seller INTEGER NOT NULL DEFAULT 0,
    has_size_option INTEGER NOT NULL DEFAULT 1,
    has_temp_option INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_toppings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0)
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'Trong' CHECK (status IN ('Trong', 'CoKhach')),
    active_order_id TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock REAL NOT NULL DEFAULT 0,
    min_stock REAL NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_customers (
    phone TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cups_accumulated INTEGER NOT NULL DEFAULT 0,
    free_drink_vouchers INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('TaiBan', 'MangDi')),
    table_id TEXT,
    table_name TEXT,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_name TEXT,
    subtotal INTEGER NOT NULL,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('TienMat', 'VietQR')),
    cash_received INTEGER,
    change_amount INTEGER,
    prep_status TEXT NOT NULL CHECK (prep_status IN ('ChoPha', 'DangPha', 'DaXong', 'DaGiao', 'DaHuy')),
    cancel_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    menu_item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cup_size TEXT,
    sugar_level TEXT,
    ice_level TEXT,
    toppings_text TEXT NOT NULL DEFAULT '',
    item_note TEXT NOT NULL DEFAULT '',
    unit_price INTEGER NOT NULL,
    line_total INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES cafe_orders(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS cafe_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_prep_status ON cafe_orders(prep_status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON cafe_orders(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON cafe_order_items(order_id)`,
];
