const activeLocks = new Set();

/**
 * Prevent multiple orders at same time per user
 */
module.exports = (req, res, next) => {
  const userId = req.user._id.toString();

  if (activeLocks.has(userId)) {
    return res.status(429).json({
      message: "Order already in progress. Please wait.",
    });
  }

  activeLocks.add(userId);

  res.on("finish", () => {
    activeLocks.delete(userId);
  });

  next();
};
