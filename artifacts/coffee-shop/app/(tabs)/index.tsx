import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, type CartItem, type Product } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Tất cả", "Cà phê", "Trà & Sinh tố", "Đồ ăn"];

function fmt(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  const colors = useColors();
  const disabled = !product.available;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={disabled ? undefined : onAdd}
      style={[
        styles.productCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
      disabled={disabled}
    >
      <View
        style={[
          styles.productIcon,
          { backgroundColor: disabled ? colors.muted : colors.secondary },
        ]}
      >
        <Ionicons
          name="cafe-outline"
          size={28}
          color={disabled ? colors.mutedForeground : colors.accent}
        />
      </View>
      <Text
        style={[styles.productName, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {product.name}
      </Text>
      <View style={styles.productFooter}>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          {fmt(product.price)}
        </Text>
        {!disabled && (
          <View
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={16} color="#fff" />
          </View>
        )}
      </View>
      {disabled && (
        <View style={[styles.soldOutBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.soldOutText, { color: colors.mutedForeground }]}>
            Hết
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CartModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, cartItemCount, updateCartQuantity, removeFromCart, checkout, clearCart } =
    useApp();
  const [confirmed, setConfirmed] = useState(false);

  function handleCheckout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkout();
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 1500);
  }

  function handleClose() {
    setConfirmed(false);
    onClose();
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartRow, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cartItemName, { color: colors.foreground }]}>
          {item.product.name}
        </Text>
        <Text style={[styles.cartItemPrice, { color: colors.mutedForeground }]}>
          {fmt(item.product.price)} × {item.quantity}
        </Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateCartQuantity(item.product.id, item.quantity - 1);
          }}
          style={[styles.qtyBtn, { borderColor: colors.border }]}
        >
          <Feather name="minus" size={14} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.qtyNum, { color: colors.foreground }]}>
          {item.quantity}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateCartQuantity(item.product.id, item.quantity + 1);
          }}
          style={[styles.qtyBtn, { borderColor: colors.border }]}
        >
          <Feather name="plus" size={14} color={colors.foreground} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.cartRowTotal, { color: colors.primary }]}>
        {fmt(item.product.price * item.quantity)}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16,
            paddingTop: Platform.OS === "web" ? 67 : 0,
          },
        ]}
      >
        {confirmed ? (
          <View style={styles.successView}>
            <View
              style={[
                styles.successCircle,
                { backgroundColor: colors.successBackground },
              ]}
            >
              <Feather name="check" size={48} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Thanh toán thành công!
            </Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Giỏ hàng ({cartItemCount} món)
              </Text>
              <View style={styles.modalHeaderRight}>
                {cart.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      clearCart();
                    }}
                    style={{ marginRight: 16 }}
                  >
                    <Text style={{ color: colors.destructive, fontSize: 14 }}>
                      Xoá tất cả
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleClose}>
                  <Feather name="x" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons
                  name="cart-outline"
                  size={64}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.emptyCartText, { color: colors.mutedForeground }]}
                >
                  Giỏ hàng trống
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.product.id}
                  renderItem={renderItem}
                  style={{ flex: 1 }}
                />
                <View
                  style={[
                    styles.checkoutSection,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.totalRow}>
                    <Text
                      style={[styles.totalLabel, { color: colors.mutedForeground }]}
                    >
                      Tổng cộng
                    </Text>
                    <Text style={[styles.totalAmount, { color: colors.primary }]}>
                      {fmt(cartTotal)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCheckout}
                    style={[
                      styles.checkoutBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Feather name="check-circle" size={20} color="#fff" />
                    <Text style={styles.checkoutBtnText}>Thanh toán</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

export default function POSScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, addToCart, cart, cartTotal, cartItemCount } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [cartVisible, setCartVisible] = useState(false);

  const filtered = useMemo(
    () =>
      selectedCategory === "Tất cả"
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [products, selectedCategory]
  );

  const webTop = Platform.OS === "web" ? 67 : 0;
  const tabBarHeight = Platform.OS === "web" ? 84 : 0;

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
          ☕ Bán hàng
        </Text>
        <TouchableOpacity
          onPress={() => setCartVisible(true)}
          style={[styles.cartButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="cart-outline" size={22} color="#fff" />
          {cartItemCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.catChip,
              {
                backgroundColor:
                  selectedCategory === cat ? colors.primary : colors.secondary,
                borderColor:
                  selectedCategory === cat ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.catChipText,
                {
                  color:
                    selectedCategory === cat
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          padding: 12,
          gap: 10,
          paddingBottom:
            cartItemCount > 0
              ? 100 + tabBarHeight + insets.bottom
              : 16 + tabBarHeight + insets.bottom,
        }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addToCart(item);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="cafe-outline"
              size={48}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Không có sản phẩm
            </Text>
          </View>
        }
      />

      {cartItemCount > 0 && (
        <TouchableOpacity
          onPress={() => setCartVisible(true)}
          style={[
            styles.cartBar,
            {
              backgroundColor: colors.primary,
              bottom: insets.bottom + tabBarHeight + 12,
            },
          ]}
        >
          <View style={styles.cartBarLeft}>
            <View
              style={[styles.cartBarBadge, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.cartBarBadgeText}>{cartItemCount}</Text>
            </View>
            <Text style={styles.cartBarLabel}>Xem giỏ hàng</Text>
          </View>
          <Text style={styles.cartBarTotal}>{fmt(cartTotal)}</Text>
        </TouchableOpacity>
      )}

      <CartModal visible={cartVisible} onClose={() => setCartVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  categoryBar: {
    borderBottomWidth: 1,
    maxHeight: 56,
    flexGrow: 0,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "center",
  },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  productCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    overflow: "hidden",
  },
  productIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  soldOutText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cartBar: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartBarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBarBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  cartBarLabel: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cartBarTotal: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderRight: { flexDirection: "row", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  cartItemName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cartItemPrice: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: { fontSize: 16, fontFamily: "Inter_600SemiBold", minWidth: 24, textAlign: "center" },
  cartRowTotal: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 75, textAlign: "right" },
  emptyCart: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyCartText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  checkoutSection: { borderTopWidth: 1, padding: 20, gap: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontFamily: "Inter_500Medium" },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  successView: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
});
