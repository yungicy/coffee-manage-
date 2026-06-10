import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
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
}

interface AppContextType {
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  cart: CartItem[];
  cartTotal: number;
  cartItemCount: number;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pJson, iJson, oJson] = await Promise.all([
          AsyncStorage.getItem(KEY_PRODUCTS),
          AsyncStorage.getItem(KEY_INGREDIENTS),
          AsyncStorage.getItem(KEY_ORDERS),
        ]);
        setProducts(pJson ? JSON.parse(pJson) : SAMPLE_PRODUCTS);
        setIngredients(iJson ? JSON.parse(iJson) : SAMPLE_INGREDIENTS);
        setOrders(oJson ? JSON.parse(oJson) : []);
      } catch {
        setProducts(SAMPLE_PRODUCTS);
        setIngredients(SAMPLE_INGREDIENTS);
        setOrders([]);
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

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }

  function clearCart() { setCart([]); }

  function checkout(): string {
    const id = genId();
    const order: Order = {
      id,
      items: cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      })),
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
    saveProducts(products.map((p) => (p.id === product.id ? product : p)));
  }
  function deleteProduct(id: string) {
    saveProducts(products.filter((p) => p.id !== id));
  }
  function toggleProductAvailability(id: string) {
    saveProducts(products.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  }

  function addIngredient(ingredient: Omit<Ingredient, "id">) {
    saveIngredients([...ingredients, { ...ingredient, id: genId() }]);
  }
  function updateIngredient(ingredient: Ingredient) {
    saveIngredients(ingredients.map((i) => (i.id === ingredient.id ? ingredient : i)));
  }
  function deleteIngredient(id: string) {
    saveIngredients(ingredients.filter((i) => i.id !== id));
  }
  function updateStock(id: string, newStock: number) {
    saveIngredients(
      ingredients.map((i) => (i.id === id ? { ...i, currentStock: newStock } : i))
    );
  }

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        products, ingredients, orders, cart,
        cartTotal, cartItemCount,
        addToCart, removeFromCart, updateCartQuantity, clearCart, checkout,
        addProduct, updateProduct, deleteProduct, toggleProductAvailability,
        addIngredient, updateIngredient, deleteIngredient, updateStock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
