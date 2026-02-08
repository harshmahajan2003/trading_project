const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");
const {
    createIPO,
    getIPOs,
    applyIPO,
    getIPOApplications,
    runBulkAllotment,
    listIPOAsStock,
    updateIPOStatus
} = require("../controllers/ipo.controller");

// Admin routes
router.post("/admin", protect, adminOnly, createIPO);
router.get("/admin/applications/:ipoId", protect, adminOnly, getIPOApplications);
router.post("/admin/run-allotment", protect, adminOnly, runBulkAllotment);
router.post("/admin/list", protect, adminOnly, listIPOAsStock);
router.patch("/admin/status", protect, adminOnly, updateIPOStatus);

// User routes
router.get("/", protect, getIPOs);
router.post("/apply", protect, applyIPO);

module.exports = router;
