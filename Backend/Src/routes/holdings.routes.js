const router = require("express").Router();
const { getHoldings } = require("../controllers/holdings.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getHoldings);

module.exports = router;
