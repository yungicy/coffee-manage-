import { Router } from "express";

const router = Router();

// ===== FAKE DATA (HOẶC SEED TẠM) =====
const menu = [
  {
    id: "1",
    name: "Cà phê sữa",
    price: 25000,
    category: "coffee",
    available: true,
  },
  {
    id: "2",
    name: "Bạc xỉu",
    price: 30000,
    category: "coffee",
    available: true,
  },
  {
    id: "3",
    name: "Trà đào",
    price: 35000,
    category: "tea",
    available: true,
  },
];

// ===== MENU ROUTE =====
router.get("/menu", (req, res) => {
  res.json(menu);
});

export default router;