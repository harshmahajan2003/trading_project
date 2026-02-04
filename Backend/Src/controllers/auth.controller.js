const User = require("../models/User");
const Wallet = require("../models/Wallet");
const jwt = require("jsonwebtoken");
const { required } = require("../utils/validate");

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Name validation
    if (trimmedName.length < 2 || trimmedName.length > 50)
      return res.status(400).json({ message: "Name must be between 2 and 50 characters" });

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(trimmedEmail))
      return res.status(400).json({ message: "Invalid email format" });

    // Password validation
    if (password.length < 6 || password.length > 128)
      return res.status(400).json({ message: "Password must be between 6 and 128 characters" });

    const exists = await User.findOne({ email: trimmedEmail });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name: trimmedName, email: trimmedEmail, password });
    await Wallet.create({ user: user._id });

    res.status(201).json({ token: genToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const trimmedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: trimmedEmail });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({ token: genToken(user._id) });
};

module.exports = { register, login };
