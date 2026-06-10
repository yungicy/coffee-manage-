import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, type CartItem, type Product, type Table } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Tất cả", "Cà phê", "Trà & Sinh tố", "Đồ ăn"];

function fmt(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
}

// ─── QR Payment Modal ───────────────────────────────────────────────────────
function QRModal({
  visible,
  total,
  tableName,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  total: number;
  tableName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bankConfig } = useApp();
  const addInfo = encodeURIComponent(tableName.replace(/\s/g, ""));
  const accountName = encodeURIComponent(bankConfig.accountName);
  const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact.png?amount=${total}&addInfo=${addInfo}&accountName=${accountName}`;
  const webBottom = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.qrContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Chuyển khoản QR</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, alignItems: "center", paddingBottom: webBottom + 20 }}>
          <View style={[styles.bankInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Ngân hàng</Text>
            <Text style={[styles.bankValue, { color: colors.foreground }]}>{bankConfig.bankId}</Text>
            <View style={[styles.dividerH, { backgroundColor: colors.border }]} />
            <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Số tài khoản</Text>
            <Text style={[styles.bankValue, { color: colors.foreground }]}>{bankConfig.accountNo}</Text>
            <View style={[styles.dividerH, { backgroundColor: colors.border }]} />
            <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Chủ tài khoản</Text>
            <Text style={[styles.bankValue, { color: colors.foreground }]}>{bankConfig.accountName}</Text>
            <View style={[styles.dividerH, { backgroundColor: colors.border }]} />
            <Text style={[styles.bankLabel, { color: colors.mutedForeground }]}>Số tiền</Text>
            <Text style={[styles.amountValue, { color: colors.primary }]}>{fmt(total)}</Text>
          </View>

          <View style={[styles.qrFrame, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.qrNote, { color: colors.mutedForeground }]}>
            Mở ứng dụng ngân hàng và quét mã QR để thanh toán
          </Text>

          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onConfirm();
            }}
            style={[styles.confirmBtn, { backgroundColor: colors.success }]}
          >
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.confirmBtnText}>Đã nhận tiền</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Table Order Modal ───────────────────────────────────────────────────────
function TableOrderModal({ table, onClose }: { table: Table; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, addToTable, removeFromTable, updateTableItemQty, saveTableBill, checkoutTable, clearTable } = useApp();
  const [activeTab, setActiveTab] = useState<"add" | "bill">("add");
  const [selectedCat, setSelectedCat] = useState("Tất cả");
  const [qrVisible, setQrVisible] = useState(false);

  const filteredProducts = useMemo(
    () => selectedCat === "Tất cả" ? products.filter((p) => p.available) : products.filter((p) => p.available && p.category === selectedCat),
    [products, selectedCat]
  );

  const tableTotal = table.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const itemCount = table.items.reduce((s, i) => s + i.quantity, 0);
  const webBottom = Platform.OS === "web" ? 34 : insets.bottom;
  const webTop = Platform.OS === "web" ? 67 : 0;

  function handleClearTable() {
    Alert.alert("Huỷ bàn", `Xoá toàn bộ đơn tại ${table.name}?`, [
      { text: "Không", style: "cancel" },
      { text: "Huỷ bàn", style: "destructive", onPress: () => { clearTable(table.id); onClose(); } },
    ]);
  }

  function handleCashCheckout() {
    Alert.alert("Xác nhận", `Thanh toán tiền mặt ${fmt(tableTotal)}?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          checkoutTable(table.id);
          onClose();
        },
      },
    ]);
  }

  const statusLabel = table.status === "empty" ? "Trống" : table.status === "open" ? "Đang phục vụ" : "Chờ thanh toán";
  const statusColor = table.status === "empty" ? colors.success : table.status === "open" ? colors.warning : colors.accent;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: webTop }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{table.name}</Text>
            <Text style={[styles.tableStatus, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {(["add", "bill"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                {tab === "add" ? "Thêm món" : `Hoá đơn${itemCount > 0 ? ` (${itemCount})` : ""}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "add" ? (
          <>
            {/* Category filter */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              style={[styles.categoryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat} onPress={() => setSelectedCat(cat)}
                  style={[styles.catChip, { backgroundColor: selectedCat === cat ? colors.primary : colors.secondary, borderColor: selectedCat === cat ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.catChipText, { color: selectedCat === cat ? "#fff" : colors.mutedForeground }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Product grid */}
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: webBottom + 80 }}
              columnWrapperStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addToTable(table.id, item); }}
                  style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.productImageSmall} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productIconBg, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="cafe-outline" size={24} color={colors.accent} />
                    </View>
                  )}
                  <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.productFooter}>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>{fmt(item.price)}</Text>
                    <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                      <Feather name="plus" size={14} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Không có sản phẩm</Text>
                </View>
              }
            />
          </>
        ) : (
          <FlatList
            data={table.items}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: webBottom + 200 }}
            ListEmptyComponent={
              <View style={styles.emptyBill}>
                <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Chưa có món nào</Text>
                <TouchableOpacity onPress={() => setActiveTab("add")}>
                  <Text style={[styles.addMoreLink, { color: colors.primary }]}>Thêm món →</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }: { item: CartItem }) => (
              <View style={[styles.billRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.billItemName, { color: colors.foreground }]}>{item.product.name}</Text>
                  <Text style={[styles.billItemPrice, { color: colors.mutedForeground }]}>{fmt(item.product.price)}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => updateTableItemQty(table.id, item.product.id, item.quantity - 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                    <Feather name="minus" size={13} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.foreground }]}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateTableItemQty(table.id, item.product.id, item.quantity + 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                    <Feather name="plus" size={13} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.billRowTotal, { color: colors.primary }]}>{fmt(item.product.price * item.quantity)}</Text>
              </View>
            )}
            ListFooterComponent={
              table.items.length > 0 ? (
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Tổng cộng</Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>{fmt(tableTotal)}</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Footer actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: webBottom + 12, backgroundColor: colors.card }]}>
          {activeTab === "add" && itemCount > 0 && (
            <TouchableOpacity onPress={() => setActiveTab("bill")} style={[styles.primaryFooterBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryFooterBtnText}>Xem hoá đơn ({itemCount} món)</Text>
            </TouchableOpacity>
          )}
          {activeTab === "bill" && table.status !== "billed" && table.items.length > 0 && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); saveTableBill(table.id); }} style={[styles.primaryFooterBtn, { backgroundColor: colors.accent }]}>
              <Feather name="printer" size={18} color="#fff" />
              <Text style={styles.primaryFooterBtnText}>Lưu bill ({fmt(tableTotal)})</Text>
            </TouchableOpacity>
          )}
          {activeTab === "bill" && table.status === "billed" && (
            <View style={{ gap: 10 }}>
              <View style={styles.paymentRow}>
                <TouchableOpacity onPress={handleCashCheckout} style={[styles.payBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="dollar-sign" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Tiền mặt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setQrVisible(true)} style={[styles.payBtn, { backgroundColor: colors.accent }]}>
                  <Ionicons name="qr-code-outline" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Chuyển khoản</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {table.items.length > 0 && (
            <TouchableOpacity onPress={handleClearTable}>
              <Text style={[styles.cancelLink, { color: colors.destructive }]}>Huỷ toàn bộ đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <QRModal
        visible={qrVisible}
        total={tableTotal}
        tableName={table.name}
        onClose={() => setQrVisible(false)}
        onConfirm={() => { setQrVisible(false); checkoutTable(table.id); onClose(); }}
      />
    </Modal>
  );
}

// ─── Table Card ──────────────────────────────────────────────────────────────
function TableCard({ table, onPress }: { table: Table; onPress: () => void }) {
  const colors = useColors();
  const total = table.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const itemCount = table.items.reduce((s, i) => s + i.quantity, 0);

  const bg =
    table.status === "empty"
      ? colors.card
      : table.status === "open"
      ? "#FFF8F0"
      : "#F0F4FF";

  const borderColor =
    table.status === "empty"
      ? colors.border
      : table.status === "open"
      ? colors.warning
      : colors.accent;

  const statusLabel =
    table.status === "empty" ? "Trống" : table.status === "open" ? "Đang phục vụ" : "Chờ thanh toán";

  const statusColor =
    table.status === "empty" ? colors.success : table.status === "open" ? colors.warning : colors.accent;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.tableCard, { backgroundColor: bg, borderColor }]}
    >
      <View style={styles.tableCardHeader}>
        <Text style={[styles.tableName, { color: colors.foreground }]}>{table.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <View style={[styles.tableIcon, { backgroundColor: table.status === "empty" ? colors.muted : borderColor + "22" }]}>
        <Ionicons
          name={table.status === "empty" ? "home-outline" : "people-outline"}
          size={30}
          color={table.status === "empty" ? colors.mutedForeground : statusColor}
        />
      </View>
      <Text style={[styles.tableStatusLabel, { color: statusColor }]}>{statusLabel}</Text>
      {table.status !== "empty" && (
        <View style={styles.tableInfo}>
          <Text style={[styles.tableInfoText, { color: colors.mutedForeground }]}>
            {itemCount} món
          </Text>
          <Text style={[styles.tableTotal, { color: colors.primary }]}>{fmt(total)}</Text>
        </View>
      )}
      {table.status === "empty" && (
        <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Chạm để đặt món</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TablesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tables } = useApp();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const tabBarHeight = Platform.OS === "web" ? 34 : 0;

  const occupied = tables.filter((t) => t.status !== "empty").length;

  // Always read latest table data from state
  const currentTable = selectedTable ? tables.find((t) => t.id === selectedTable.id) ?? null : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 12 + webTop }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Bàn ngồi</Text>
        <View style={[styles.occupiedBadge, { backgroundColor: occupied > 0 ? colors.accent : colors.muted }]}>
          <Text style={[styles.occupiedText, { color: occupied > 0 ? "#fff" : colors.mutedForeground }]}>
            {occupied}/{tables.length} bàn
          </Text>
        </View>
      </View>

      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: insets.bottom + tabBarHeight + 16 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TableCard table={item} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedTable(item); }} />
        )}
      />

      {currentTable && (
        <TableOrderModal table={currentTable} onClose={() => setSelectedTable(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  occupiedBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  occupiedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  tableCard: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 8, alignItems: "center", minHeight: 160 },
  tableCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  tableName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  tableIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginVertical: 4 },
  tableStatusLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tableInfo: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 2 },
  tableInfoText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tableTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tapHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  tableStatus: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },

  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  categoryBar: { borderBottomWidth: 1, maxHeight: 52, flexGrow: 0 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, alignSelf: "center" },
  catChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  productCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  productImageSmall: { width: "100%", height: 70, borderRadius: 8 },
  productIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  productFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  productPrice: { fontSize: 12, fontFamily: "Inter_700Bold" },
  addBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  billRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
  billItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  billItemPrice: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 15, fontFamily: "Inter_600SemiBold", minWidth: 22, textAlign: "center" },
  billRowTotal: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 75, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTopWidth: 1, marginTop: 6 },
  totalLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold" },

  emptyBill: { alignItems: "center", paddingTop: 50, gap: 12 },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  addMoreLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 4 },

  footer: { borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 16, gap: 10 },
  primaryFooterBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, gap: 8 },
  primaryFooterBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  paymentRow: { flexDirection: "row", gap: 10 },
  payBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, gap: 8 },
  payBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  cancelLink: { textAlign: "center", fontSize: 14, fontFamily: "Inter_500Medium" },

  qrContainer: { flex: 1 },
  bankInfoCard: { width: "100%", padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  bankLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bankValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  amountValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  dividerH: { height: 1, marginVertical: 4 },
  qrFrame: { padding: 16, borderRadius: 16, borderWidth: 1 },
  qrImage: { width: 240, height: 240 },
  qrNote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14, gap: 8 },
  confirmBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
