const express = require("express");
const {
  addStock,
  getAllStocks,
  getAllUsers,
  blockUser,
  getAllOrders,
} = require("../controllers/admin.controller");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const router = express.Router();

router.post("/stocks", protect, adminOnly, addStock);
router.get("/stocks", protect, adminOnly, getAllStocks);

router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id", protect, adminOnly, blockUser);

router.get("/orders", protect, adminOnly, getAllOrders);

module.exports = router;
