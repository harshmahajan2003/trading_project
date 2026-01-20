const User = require("../models/User");
const Wallet = require("../models/Wallet");
const jwt = require("jsonwebtoken");
const { required } = require("../utils/validate");

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (![name, email, password].every(required))
    return res.status(400).json({ message: "All fields required" });

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).json({ message: "Email already exists" });

  const user = await User.create({ name, email, password });
  await Wallet.create({ user: user._id });

  res.status(201).json({ token: genToken(user._id) });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (![email, password].every(required))
    return res.status(400).json({ message: "Email & password required" });

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ token: genToken(user._id) });
};

module.exports = { register, login };
