import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, type Order } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function fmt(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function OrderCard({ order }: { order: Order }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded((v) => !v)}
      style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.orderHeader}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.orderTime, { color: colors.foreground }]}>
            {fmtTime(order.createdAt)}{" "}
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              — {fmtDate(order.createdAt)}
            </Text>
          </Text>
          <Text style={[styles.orderSummary, { color: colors.mutedForeground }]}>
            {order.items.length} món ·{" "}
            {order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
          </Text>
        </View>
        <View style={styles.orderRight}>
          <Text style={[styles.orderTotal, { color: colors.primary }]}>
            {fmt(order.total)}
          </Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      </View>

      {expanded && (
        <View style={[styles.orderItems, { borderTopColor: colors.border }]}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.orderItemRow}>
              <Text style={[styles.orderItemName, { color: colors.foreground }]}>
                {item.productName}
              </Text>
              <Text style={[styles.orderItemQty, { color: colors.mutedForeground }]}>
                ×{item.quantity}
              </Text>
              <Text style={[styles.orderItemPrice, { color: colors.accent }]}>
                {fmt(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders } = useApp();

  const todayOrders = useMemo(
    () => orders.filter((o) => isToday(o.createdAt)),
    [orders]
  );
  const todayRevenue = useMemo(
    () => todayOrders.reduce((s, o) => s + o.total, 0),
    [todayOrders]
  );

  const webTop = Platform.OS === "web" ? 67 : 0;
  const tabBarHeight = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12 + webTop,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Đơn hàng
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          gap: 10,
          paddingBottom: insets.bottom + tabBarHeight + 16,
        }}
        ListHeaderComponent={
          <View style={styles.statsSection}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="today-outline" size={22} color={colors.accent} />
              <View>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  Doanh thu hôm nay
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {fmt(todayRevenue)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="receipt-outline"
                size={22}
                color={colors.accent}
              />
              <View>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  Số đơn hôm nay
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {todayOrders.length} đơn
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="receipt-outline"
              size={56}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Chưa có đơn hàng
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tạo đơn đầu tiên ở tab Bán hàng
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statsSection: { flexDirection: "row", gap: 10, marginBottom: 6 },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2 },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  orderTime: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  orderSummary: { fontSize: 13, fontFamily: "Inter_400Regular" },
  orderRight: { alignItems: "flex-end", gap: 4 },
  orderTotal: { fontSize: 17, fontFamily: "Inter_700Bold" },
  orderItems: { borderTopWidth: 1, padding: 14, gap: 8 },
  orderItemRow: { flexDirection: "row", alignItems: "center" },
  orderItemName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  orderItemQty: { fontSize: 14, fontFamily: "Inter_500Medium", marginRight: 12 },
  orderItemPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
