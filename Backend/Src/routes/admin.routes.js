const express = require("express");
const {
  addStock,
  getAllStocks,
  getAllUsers,
  blockUser,
  getAllOrders,
  deleteStock,
} = require("../controllers/admin.controller");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const router = express.Router();

router.post("/stocks", protect, adminOnly, addStock);
router.get("/stocks", protect, adminOnly, getAllStocks);
router.delete("/stocks/:id", protect, adminOnly, deleteStock);

router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id", protect, adminOnly, blockUser);

router.get("/orders", protect, adminOnly, getAllOrders);

module.exports = router;
