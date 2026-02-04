const router = require("express").Router();
const { getMyTransactions, getMarketPulse } = require("../controllers/transactions.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getMyTransactions);
router.get("/pulse", protect, getMarketPulse);

module.exports = router;
