import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  imageUri?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  tableId?: string;
}

export type TableStatus = "empty" | "open" | "billed";

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  items: CartItem[];
  savedAt?: string;
}

export interface BankConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
}

const DEFAULT_BANK: BankConfig = {
  bankId: "MB",
  accountNo: "0123456789",
  accountName: "QUAN CA PHE",
};

const INITIAL_TABLES: Table[] = [
  { id: "t1", name: "Bàn 1", status: "empty", items: [] },
  { id: "t2", name: "Bàn 2", status: "empty", items: [] },
  { id: "t3", name: "Bàn 3", status: "empty", items: [] },
  { id: "t4", name: "Bàn 4", status: "empty", items: [] },
  { id: "t5", name: "Bàn 5", status: "empty", items: [] },
];

interface AppContextType {
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  cart: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  tables: Table[];
  bankConfig: BankConfig;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: () => string;

  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  addIngredient: (ingredient: Omit<Ingredient, "id">) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  updateStock: (id: string, newStock: number) => void;

  addToTable: (tableId: string, product: Product) => void;
  removeFromTable: (tableId: string, productId: string) => void;
  updateTableItemQty: (tableId: string, productId: string, qty: number) => void;
  saveTableBill: (tableId: string) => void;
  checkoutTable: (tableId: string) => void;
  clearTable: (tableId: string) => void;

  updateBankConfig: (config: BankConfig) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: "p1", name: "Cà phê đen đá", price: 25000, category: "Cà phê", available: true },
  { id: "p2", name: "Cà phê sữa đá", price: 30000, category: "Cà phê", available: true },
  { id: "p3", name: "Bạc xỉu", price: 35000, category: "Cà phê", available: true },
  { id: "p4", name: "Cappuccino", price: 45000, category: "Cà phê", available: true },
  { id: "p5", name: "Trà sữa trân châu", price: 45000, category: "Trà & Sinh tố", available: true },
  { id: "p6", name: "Trà đào cam sả", price: 40000, category: "Trà & Sinh tố", available: true },
  { id: "p7", name: "Sinh tố bơ", price: 55000, category: "Trà & Sinh tố", available: true },
  { id: "p8", name: "Nước ép cam", price: 40000, category: "Trà & Sinh tố", available: true },
  { id: "p9", name: "Bánh tiramisu", price: 45000, category: "Đồ ăn", available: true },
  { id: "p10", name: "Bánh mì thịt", price: 30000, category: "Đồ ăn", available: false },
];

const SAMPLE_INGREDIENTS: Ingredient[] = [
  { id: "i1", name: "Cà phê rang xay", unit: "g", currentStock: 450, minStock: 200 },
  { id: "i2", name: "Sữa đặc", unit: "ml", currentStock: 1800, minStock: 500 },
  { id: "i3", name: "Sữa tươi", unit: "ml", currentStock: 1200, minStock: 1000 },
  { id: "i4", name: "Đường", unit: "g", currentStock: 800, minStock: 300 },
  { id: "i5", name: "Trà Oolong", unit: "g", currentStock: 80, minStock: 100 },
  { id: "i6", name: "Bột trân châu", unit: "g", currentStock: 150, minStock: 150 },
  { id: "i7", name: "Ly nhựa", unit: "cái", currentStock: 180, minStock: 50 },
  { id: "i8", name: "Ống hút", unit: "cái", currentStock: 30, minStock: 50 },
  { id: "i9", name: "Đá viên", unit: "g", currentStock: 4500, minStock: 2000 },
  { id: "i10", name: "Bơ tươi", unit: "quả", currentStock: 4, minStock: 2 },
];

const KEY_PRODUCTS = "@coffee_products";
const KEY_INGREDIENTS = "@coffee_ingredients";
const KEY_ORDERS = "@coffee_orders";
const KEY_TABLES = "@coffee_tables";
const KEY_BANK = "@coffee_bank";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig>(DEFAULT_BANK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pJ, iJ, oJ, tJ, bJ] = await Promise.all([
          AsyncStorage.getItem(KEY_PRODUCTS),
          AsyncStorage.getItem(KEY_INGREDIENTS),
          AsyncStorage.getItem(KEY_ORDERS),
          AsyncStorage.getItem(KEY_TABLES),
          AsyncStorage.getItem(KEY_BANK),
        ]);
        setProducts(pJ ? JSON.parse(pJ) : SAMPLE_PRODUCTS);
        setIngredients(iJ ? JSON.parse(iJ) : SAMPLE_INGREDIENTS);
        setOrders(oJ ? JSON.parse(oJ) : []);
        setTables(tJ ? JSON.parse(tJ) : INITIAL_TABLES);
        setBankConfig(bJ ? JSON.parse(bJ) : DEFAULT_BANK);
      } catch {
        setProducts(SAMPLE_PRODUCTS);
        setIngredients(SAMPLE_INGREDIENTS);
        setOrders([]);
        setTables(INITIAL_TABLES);
        setBankConfig(DEFAULT_BANK);
      }
      setLoaded(true);
    })();
  }, []);

  async function saveProducts(data: Product[]) {
    setProducts(data);
    await AsyncStorage.setItem(KEY_PRODUCTS, JSON.stringify(data));
  }
  async function saveIngredients(data: Ingredient[]) {
    setIngredients(data);
    await AsyncStorage.setItem(KEY_INGREDIENTS, JSON.stringify(data));
  }
  async function saveOrders(data: Order[]) {
    setOrders(data);
    await AsyncStorage.setItem(KEY_ORDERS, JSON.stringify(data));
  }
  async function saveTables(data: Table[]) {
    setTables(data);
    await AsyncStorage.setItem(KEY_TABLES, JSON.stringify(data));
  }

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }
  function removeFromCart(productId: string) {
    setCart((p) => p.filter((i) => i.product.id !== productId));
  }
  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart((p) => p.map((i) => i.product.id === productId ? { ...i, quantity } : i));
  }
  function clearCart() { setCart([]); }
  function checkout(): string {
    const id = genId();
    const order: Order = {
      id,
      items: cart.map((i) => ({ productId: i.product.id, productName: i.product.name, quantity: i.quantity, price: i.product.price })),
      total: cartTotal,
      createdAt: new Date().toISOString(),
    };
    saveOrders([order, ...orders]);
    setCart([]);
    return id;
  }

  function addProduct(product: Omit<Product, "id">) {
    saveProducts([...products, { ...product, id: genId() }]);
  }
  function updateProduct(product: Product) {
    saveProducts(products.map((p) => p.id === product.id ? product : p));
  }
  function deleteProduct(id: string) {
    saveProducts(products.filter((p) => p.id !== id));
  }
  function toggleProductAvailability(id: string) {
    saveProducts(products.map((p) => p.id === id ? { ...p, available: !p.available } : p));
  }

  function addIngredient(ingredient: Omit<Ingredient, "id">) {
    saveIngredients([...ingredients, { ...ingredient, id: genId() }]);
  }
  function updateIngredient(ingredient: Ingredient) {
    saveIngredients(ingredients.map((i) => i.id === ingredient.id ? ingredient : i));
  }
  function deleteIngredient(id: string) {
    saveIngredients(ingredients.filter((i) => i.id !== id));
  }
  function updateStock(id: string, newStock: number) {
    saveIngredients(ingredients.map((i) => i.id === id ? { ...i, currentStock: newStock } : i));
  }

  function addToTable(tableId: string, product: Product) {
    const updated = tables.map((t) => {
      if (t.id !== tableId) return t;
      const ex = t.items.find((i) => i.product.id === product.id);
      const newItems = ex
        ? t.items.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...t.items, { product, quantity: 1 }];
      return { ...t, items: newItems, status: t.status === "empty" ? ("open" as TableStatus) : t.status };
    });
    saveTables(updated);
  }
  function removeFromTable(tableId: string, productId: string) {
    const updated = tables.map((t) => {
      if (t.id !== tableId) return t;
      const newItems = t.items.filter((i) => i.product.id !== productId);
      return { ...t, items: newItems, status: newItems.length === 0 ? ("empty" as TableStatus) : t.status };
    });
    saveTables(updated);
  }
  function updateTableItemQty(tableId: string, productId: string, qty: number) {
    if (qty <= 0) { removeFromTable(tableId, productId); return; }
    const updated = tables.map((t) => {
      if (t.id !== tableId) return t;
      return { ...t, items: t.items.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i) };
    });
    saveTables(updated);
  }
  function saveTableBill(tableId: string) {
    const updated = tables.map((t) =>
      t.id === tableId ? { ...t, status: "billed" as TableStatus, savedAt: new Date().toISOString() } : t
    );
    saveTables(updated);
  }
  function checkoutTable(tableId: string) {
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.items.length === 0) return;
    const total = table.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const order: Order = {
      id: genId(),
      items: table.items.map((i) => ({ productId: i.product.id, productName: i.product.name, quantity: i.quantity, price: i.product.price })),
      total,
      createdAt: new Date().toISOString(),
      tableId,
    };
    saveOrders([order, ...orders]);
    const updated = tables.map((t) =>
      t.id === tableId ? { ...t, status: "empty" as TableStatus, items: [], savedAt: undefined } : t
    );
    saveTables(updated);
  }
  function clearTable(tableId: string) {
    const updated = tables.map((t) =>
      t.id === tableId ? { ...t, status: "empty" as TableStatus, items: [], savedAt: undefined } : t
    );
    saveTables(updated);
  }

  function updateBankConfig(config: BankConfig) {
    setBankConfig(config);
    AsyncStorage.setItem(KEY_BANK, JSON.stringify(config));
  }

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      products, ingredients, orders, cart, cartTotal, cartItemCount,
      tables, bankConfig,
      addToCart, removeFromCart, updateCartQuantity, clearCart, checkout,
      addProduct, updateProduct, deleteProduct, toggleProductAvailability,
      addIngredient, updateIngredient, deleteIngredient, updateStock,
      addToTable, removeFromTable, updateTableItemQty, saveTableBill, checkoutTable, clearTable,
      updateBankConfig,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
