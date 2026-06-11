import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { api } from "../lib/api";

export default function TablesScreen() {
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await api.getTables();
    setTables(data);
  }

  async function toggle(table: any) {
    await api.updateTable(table.id, {
      status: table.status === "free" ? "occupied" : "free",
    });

    load();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>TABLES</Text>

      <FlatList
        data={tables}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggle(item)}
            style={{
              padding: 16,
              borderWidth: 1,
              marginVertical: 6,
              backgroundColor:
                item.status === "free" ? "#d4ffd4" : "#ffd4d4",
            }}
          >
            <Text>{item.name}</Text>
            <Text>{item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}