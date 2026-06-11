import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { api } from "../lib/api";

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await api.getOrders();
    setOrders(data);
  }

  async function done(id: string) {
    await api.updateOrder(id, { status: "done" });
    load();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>ORDERS</Text>

      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, marginVertical: 6 }}>
            <Text>Table: {item.tableId}</Text>
            <Text>Total: {item.total}</Text>
            <Text>Status: {item.status}</Text>

            <TouchableOpacity onPress={() => done(item.id)}>
              <Text style={{ color: "green" }}>DONE</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}