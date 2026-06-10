import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, type Ingredient } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type StockLevel = "critical" | "low" | "ok";

function getStockLevel(ingredient: Ingredient): StockLevel {
  if (ingredient.currentStock < ingredient.minStock) return "critical";
  if (ingredient.currentStock < ingredient.minStock * 2) return "low";
  return "ok";
}

function IngredientModal({
  visible,
  ingredient,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  ingredient: Ingredient | null;
  onClose: () => void;
  onSave: (data: Omit<Ingredient, "id"> | Ingredient) => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isNew = !ingredient;

  const [name, setName] = useState(ingredient?.name ?? "");
  const [unit, setUnit] = useState(ingredient?.unit ?? "");
  const [currentStock, setCurrentStock] = useState(
    ingredient?.currentStock.toString() ?? ""
  );
  const [minStock, setMinStock] = useState(
    ingredient?.minStock.toString() ?? ""
  );

  React.useEffect(() => {
    if (visible) {
      setName(ingredient?.name ?? "");
      setUnit(ingredient?.unit ?? "");
      setCurrentStock(ingredient?.currentStock.toString() ?? "");
      setMinStock(ingredient?.minStock.toString() ?? "");
    }
  }, [visible, ingredient]);

  function handleSave() {
    if (!name.trim() || !unit.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên và đơn vị.");
      return;
    }
    const cs = parseFloat(currentStock);
    const ms = parseFloat(minStock);
    if (isNaN(cs) || isNaN(ms) || cs < 0 || ms < 0) {
      Alert.alert("Lỗi", "Số lượng không hợp lệ.");
      return;
    }
    const data = { name: name.trim(), unit: unit.trim(), currentStock: cs, minStock: ms };
    if (ingredient) {
      onSave({ ...data, id: ingredient.id } as Ingredient);
    } else {
      onSave(data);
    }
    onClose();
  }

  const webBottom = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.background,
              paddingTop: Platform.OS === "web" ? 67 : 0,
            },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {isNew ? "Thêm nguyên liệu" : "Chỉnh sửa nguyên liệu"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 20,
              gap: 16,
              paddingBottom: webBottom + 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Tên nguyên liệu *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="VD: Cà phê rang xay"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card },
                ]}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Đơn vị *
              </Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="VD: g, ml, cái, kg"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card },
                ]}
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Tồn kho hiện tại
                </Text>
                <TextInput
                  value={currentStock}
                  onChangeText={setCurrentStock}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.input,
                    { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card },
                  ]}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Mức tối thiểu
                </Text>
                <TextInput
                  value={minStock}
                  onChangeText={setMinStock}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.input,
                    { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.saveBtnText}>
                {isNew ? "Thêm nguyên liệu" : "Lưu thay đổi"}
              </Text>
            </TouchableOpacity>

            {!isNew && onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                style={[styles.deleteBtn, { borderColor: colors.destructive }]}
              >
                <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
                  Xoá nguyên liệu
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function IngredientRow({
  ingredient,
  onPress,
}: {
  ingredient: Ingredient;
  onPress: () => void;
}) {
  const colors = useColors();
  const level = getStockLevel(ingredient);

  const levelColor =
    level === "critical"
      ? colors.destructive
      : level === "low"
      ? colors.warning
      : colors.success;

  const levelBg =
    level === "critical"
      ? "#FFEBEE"
      : level === "low"
      ? colors.warningBackground
      : colors.successBackground;

  const levelLabel =
    level === "critical" ? "Hết hàng" : level === "low" ? "Sắp hết" : "Đủ hàng";

  const pct = Math.min(
    1,
    ingredient.minStock > 0 ? ingredient.currentStock / (ingredient.minStock * 3) : 1
  );

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.ingredientRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.levelDot,
          { backgroundColor: levelBg, borderColor: levelColor },
        ]}
      >
        <Feather
          name={level === "ok" ? "check" : "alert-triangle"}
          size={14}
          color={levelColor}
        />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.ingredientTopRow}>
          <Text style={[styles.ingredientName, { color: colors.foreground }]}>
            {ingredient.name}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: levelBg }]}>
            <Text style={[styles.levelBadgeText, { color: levelColor }]}>
              {levelLabel}
            </Text>
          </View>
        </View>
        <View style={styles.stockInfo}>
          <Text style={[styles.stockText, { color: colors.mutedForeground }]}>
            {ingredient.currentStock} {ingredient.unit} / tối thiểu{" "}
            {ingredient.minStock} {ingredient.unit}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct * 100}%` as any, backgroundColor: levelColor },
            ]}
          />
        </View>
      </View>
      <Feather name="edit-2" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ingredients, addIngredient, updateIngredient, deleteIngredient } =
    useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Ingredient | null>(null);

  const lowCount = useMemo(
    () => ingredients.filter((i) => getStockLevel(i) !== "ok").length,
    [ingredients]
  );
  const criticalCount = useMemo(
    () => ingredients.filter((i) => getStockLevel(i) === "critical").length,
    [ingredients]
  );

  const webTop = Platform.OS === "web" ? 67 : 0;
  const tabBarHeight = Platform.OS === "web" ? 34 : 0;

  function openAdd() {
    setSelected(null);
    setModalVisible(true);
  }
  function openEdit(ing: Ingredient) {
    setSelected(ing);
    setModalVisible(true);
  }

  function handleSave(data: Omit<Ingredient, "id"> | Ingredient) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if ("id" in data) {
      updateIngredient(data as Ingredient);
    } else {
      addIngredient(data);
    }
  }

  function handleDelete() {
    if (!selected) return;
    Alert.alert(
      "Xoá nguyên liệu",
      `Bạn chắc chắn muốn xoá "${selected.name}"?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: () => {
            deleteIngredient(selected.id);
            setModalVisible(false);
          },
        },
      ]
    );
  }

  const sorted = useMemo(() => {
    return [...ingredients].sort((a, b) => {
      const la = getStockLevel(a);
      const lb = getStockLevel(b);
      const order = { critical: 0, low: 1, ok: 2 };
      return order[la] - order[lb];
    });
  }, [ingredients]);

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
          Kho nguyên liệu
        </Text>
        <TouchableOpacity
          onPress={openAdd}
          style={[styles.addFab, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          gap: 10,
          paddingBottom: insets.bottom + tabBarHeight + 16,
        }}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="cube-outline" size={20} color={colors.accent} />
              <View>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Tổng loại
                </Text>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {ingredients.length}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: criticalCount > 0 ? "#FFEBEE" : colors.warningBackground, borderColor: criticalCount > 0 ? colors.destructive : colors.warning },
              ]}
            >
              <Feather
                name="alert-triangle"
                size={20}
                color={criticalCount > 0 ? colors.destructive : colors.warning}
              />
              <View>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Cần bổ sung
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: criticalCount > 0 ? colors.destructive : colors.warning },
                  ]}
                >
                  {lowCount} loại
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <IngredientRow ingredient={item} onPress={() => openEdit(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="cube-outline"
              size={56}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Chưa có nguyên liệu
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nhấn + để thêm nguyên liệu đầu tiên
            </Text>
          </View>
        }
      />

      <IngredientModal
        visible={modalVisible}
        ingredient={selected}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={selected ? handleDelete : undefined}
      />
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  addFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 1 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  levelDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingredientName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  levelBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  stockInfo: {},
  stockText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldGroup: { gap: 6 },
  fieldRow: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
