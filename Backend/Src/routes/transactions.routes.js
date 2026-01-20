const router = require("express").Router();
const { getMyTransactions } = require("../controllers/transactions.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getMyTransactions);

module.exports = router;
