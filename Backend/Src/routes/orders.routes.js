const router = require("express").Router();
const { buyStock, sellStock, getMyOrders } = require("../controllers/orders.controller");
const { protect } = require("../middleware/auth.middleware");
const orderLock = require("../middleware/orderLock.middleware");
const asyncHandler = require("../middleware/asyncHandler");

router.get("/", protect, asyncHandler(getMyOrders));
router.post("/buy", protect, orderLock, asyncHandler(buyStock));
router.post("/sell", protect, orderLock, asyncHandler(sellStock));

module.exports = router;
