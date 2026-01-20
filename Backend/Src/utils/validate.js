const isPositiveNumber = (n) =>
  typeof n === "number" && !isNaN(n) && n > 0;

const required = (v) => v !== undefined && v !== null && v !== "";

module.exports = { isPositiveNumber, required };
