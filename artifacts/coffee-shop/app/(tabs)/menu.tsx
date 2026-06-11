import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { api } from "../lib/api";

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
};

export default function MenuScreen() {
  const [menu, setMenu] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableId] = useState("T1");

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const data = await api.getMenu();
      setMenu(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(item: Product) {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === item.id);
      if (exist) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  const total = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [cart]);

  async function checkout() {
    if (cart.length === 0) return;

    await api.createOrder({
      tableId,
      items: cart,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    setCart([]);
    alert("Order created!");
  }

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>

      <Text style={{ fontSize: 20 }}>MENU</Text>

      <FlatList
        data={menu}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => addToCart(item)}
            style={{
              padding: 12,
              borderWidth: 1,
              marginVertical: 6,
            }}
          >
            <Text>{item.name}</Text>
            <Text>{item.price}đ</Text>
          </TouchableOpacity>
        )}
      />

      <View style={{ borderTopWidth: 1, marginTop: 10, paddingTop: 10 }}>
        <Text>CART</Text>

        {cart.map((i) => (
          <View key={i.id}>
            <Text>
              {i.name} x{i.qty}
            </Text>
            <TouchableOpacity onPress={() => removeFromCart(i.id)}>
              <Text>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text>Total: {total}</Text>

        <TouchableOpacity onPress={checkout}>
          <Text style={{ color: "green" }}>ORDER NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}