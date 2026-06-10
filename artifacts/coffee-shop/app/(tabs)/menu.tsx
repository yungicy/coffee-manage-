import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, type BankConfig, type Product } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const MENU_CATEGORIES = ["Cà phê", "Trà & Sinh tố", "Đồ ăn"];
const ALL_FILTER = "Tất cả";

const POPULAR_BANKS = [
  { id: "MB", name: "MB Bank" },
  { id: "VCB", name: "Vietcombank" },
  { id: "TCB", name: "Techcombank" },
  { id: "ACB", name: "ACB" },
  { id: "VPB", name: "VPBank" },
  { id: "BIDV", name: "BIDV" },
  { id: "VTB", name: "Vietinbank" },
  { id: "STB", name: "Sacombank" },
];

function fmt(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
}

// ─── Bank Settings Modal ──────────────────────────────────────────────────────
function BankSettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bankConfig, updateBankConfig } = useApp();
  const [bankId, setBankId] = useState(bankConfig.bankId);
  const [accountNo, setAccountNo] = useState(bankConfig.accountNo);
  const [accountName, setAccountName] = useState(bankConfig.accountName);

  React.useEffect(() => {
    if (visible) {
      setBankId(bankConfig.bankId);
      setAccountNo(bankConfig.accountNo);
      setAccountName(bankConfig.accountName);
    }
  }, [visible, bankConfig]);

  function handleSave() {
    if (!accountNo.trim() || !accountName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    updateBankConfig({ bankId, accountNo: accountNo.trim(), accountName: accountName.trim().toUpperCase() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  const webBottom = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Cài đặt thanh toán QR</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: webBottom + 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Ngân hàng</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {POPULAR_BANKS.map((b) => (
                  <TouchableOpacity
                    key={b.id} onPress={() => setBankId(b.id)}
                    style={[styles.bankChip, { backgroundColor: bankId === b.id ? colors.primary : colors.secondary, borderColor: bankId === b.id ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.bankChipText, { color: bankId === b.id ? "#fff" : colors.mutedForeground }]}>{b.id}</Text>
                    <Text style={[styles.bankChipSub, { color: bankId === b.id ? "#ffffffaa" : colors.mutedForeground }]}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Số tài khoản *</Text>
              <TextInput value={accountNo} onChangeText={setAccountNo} keyboardType="numeric" placeholder="VD: 0123456789" placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Tên chủ tài khoản *</Text>
              <TextInput value={accountName} onChangeText={setAccountName} placeholder="VD: NGUYEN VAN A" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters"
                style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]} />
            </View>
            <View style={[styles.previewCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Mã QR sẽ hiển thị:</Text>
              <Text style={[styles.previewValue, { color: colors.foreground }]}>{bankId} — {accountNo || "..."}</Text>
              <Text style={[styles.previewName, { color: colors.primary }]}>{accountName || "..."}</Text>
            </View>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>Lưu cài đặt</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ visible, product, onClose, onSave, onDelete }: {
  visible: boolean; product: Product | null; onClose: () => void;
  onSave: (data: Omit<Product, "id"> | Product) => void; onDelete?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isNew = !product;
  const [name, setName] = useState(product?.name ?? "");
  const [priceStr, setPriceStr] = useState(product?.price.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? MENU_CATEGORIES[0]);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [imageUri, setImageUri] = useState(product?.imageUri ?? "");

  React.useEffect(() => {
    if (visible) {
      setName(product?.name ?? "");
      setPriceStr(product?.price.toString() ?? "");
      setCategory(product?.category ?? MENU_CATEGORIES[0]);
      setAvailable(product?.available ?? true);
      setImageUri(product?.imageUri ?? "");
    }
  }, [visible, product]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cho phép truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  function handleSave() {
    if (!name.trim()) { Alert.alert("Lỗi", "Vui lòng nhập tên món."); return; }
    const price = parseFloat(priceStr.replace(/\./g, ""));
    if (isNaN(price) || price <= 0) { Alert.alert("Lỗi", "Vui lòng nhập giá hợp lệ."); return; }
    const data = { name: name.trim(), price, category, available, imageUri: imageUri || undefined };
    if (product) { onSave({ ...data, id: product.id } as Product); } else { onSave(data); }
    onClose();
  }

  const webBottom = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 67 : 0 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{isNew ? "Thêm món mới" : "Chỉnh sửa món"}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={colors.foreground} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: webBottom + 20 }} keyboardShouldPersistTaps="handled">
            {/* Image picker */}
            <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                  <View style={styles.imageEditOverlay}>
                    <Feather name="camera" size={20} color="#fff" />
                    <Text style={styles.imageEditText}>Đổi ảnh</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>Thêm ảnh món</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Tên món *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="VD: Cà phê sữa đá" placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Giá (₫) *</Text>
              <TextInput value={priceStr} onChangeText={setPriceStr} keyboardType="numeric" placeholder="VD: 35000" placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { borderColor: colors.input, color: colors.foreground, backgroundColor: colors.card }]} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Danh mục</Text>
              <View style={styles.categoryPicker}>
                {MENU_CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                    style={[styles.catOption, { backgroundColor: category === cat ? colors.primary : colors.secondary, borderColor: category === cat ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.catOptionText, { color: category === cat ? "#fff" : colors.mutedForeground }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Đang bán</Text>
                <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>{available ? "Món đang được bán" : "Món tạm ẩn"}</Text>
              </View>
              <Switch value={available} onValueChange={setAvailable} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor="#fff" />
            </View>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>{isNew ? "Thêm món" : "Lưu thay đổi"}</Text>
            </TouchableOpacity>
            {!isNew && onDelete && (
              <TouchableOpacity onPress={onDelete} style={[styles.deleteBtn, { borderColor: colors.destructive }]}>
                <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Xoá món này</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ product, onEdit, onToggle }: { product: Product; onEdit: () => void; onToggle: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: product.available ? 1 : 0.6 }]}>
      {product.imageUri ? (
        <Image source={{ uri: product.imageUri }} style={styles.productRowImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productRowIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name="cafe-outline" size={22} color={colors.accent} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
        <View style={styles.productMeta}>
          <Text style={[styles.productPrice, { color: colors.accent }]}>{fmt(product.price)}</Text>
          <View style={[styles.categoryTag, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTagText, { color: colors.mutedForeground }]}>{product.category}</Text>
          </View>
        </View>
      </View>
      <Switch value={product.available} onValueChange={onToggle} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor="#fff" style={{ marginRight: 8 }} />
      <TouchableOpacity onPress={onEdit} style={[styles.editBtn, { backgroundColor: colors.secondary }]}>
        <Feather name="edit-2" size={15} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, deleteProduct, toggleProductAvailability } = useApp();
  const [filter, setFilter] = useState(ALL_FILTER);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);

  const filtered = useMemo(
    () => filter === ALL_FILTER ? products : products.filter((p) => p.category === filter),
    [products, filter]
  );

  const webTop = Platform.OS === "web" ? 67 : 0;
  const tabBarHeight = Platform.OS === "web" ? 34 : 0;

  function handleSave(data: Omit<Product, "id"> | Product) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if ("id" in data) { updateProduct(data as Product); } else { addProduct(data); }
  }

  function handleDelete() {
    if (!selected) return;
    Alert.alert("Xoá món", `Bạn chắc chắn muốn xoá "${selected.name}"?`, [
      { text: "Huỷ", style: "cancel" },
      { text: "Xoá", style: "destructive", onPress: () => { deleteProduct(selected.id); setModalVisible(false); } },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 12 + webTop }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Thực đơn</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setBankModalVisible(true)} style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="qr-code-outline" size={19} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSelected(null); setModalVisible(true); }} style={[styles.iconBtn, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {[ALL_FILTER, ...MENU_CATEGORIES].map((cat) => (
          <TouchableOpacity key={cat} onPress={() => setFilter(cat)}
            style={[styles.catChip, { backgroundColor: filter === cat ? colors.primary : colors.secondary, borderColor: filter === cat ? colors.primary : colors.border }]}
          >
            <Text style={[styles.catChipText, { color: filter === cat ? "#fff" : colors.mutedForeground }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + tabBarHeight + 16 }}
        ListHeaderComponent={
          <Text style={[styles.summaryText, { color: colors.mutedForeground, marginBottom: 4 }]}>
            {products.length} món · {products.filter((p) => p.available).length} đang bán · {products.filter((p) => !p.available).length} ẩn
          </Text>
        }
        renderItem={({ item }) => (
          <ProductRow product={item} onEdit={() => { setSelected(item); setModalVisible(true); }}
            onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleProductAvailability(item.id); }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cafe-outline" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Chưa có món nào</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nhấn + để thêm món đầu tiên</Text>
          </View>
        }
      />

      <ProductModal visible={modalVisible} product={selected} onClose={() => setModalVisible(false)} onSave={handleSave} onDelete={selected ? handleDelete : undefined} />
      <BankSettingsModal visible={bankModalVisible} onClose={() => setBankModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  filterBar: { borderBottomWidth: 1, maxHeight: 56, flexGrow: 0 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignSelf: "center" },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  productRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
  productRowImage: { width: 48, height: 48, borderRadius: 10 },
  productRowIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  productMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  productPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryTagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  editBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  imagePicker: { height: 140, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", overflow: "hidden" },
  imagePreview: { width: "100%", height: "100%" },
  imageEditOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 6 },
  imageEditText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catOptionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: 1 },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  deleteBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  bankChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center", minWidth: 80 },
  bankChipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  bankChipSub: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  previewCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  previewLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  previewName: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
