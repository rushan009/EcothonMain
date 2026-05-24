const User = require('../models/User');
const Collector = require('../models/Collector');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_refresh_secret';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '30d';

const buildAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });

const buildRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });

exports.registerUser = async (req, res) => {
  try {
    console.log('registerUser payload:', req.body);
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    const accessToken = buildAccessToken(newUser);
    const refreshToken = buildRefreshToken(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // If the user is a collector, create a corresponding collector document
    if (role === 'collector') {
      const newCollector = new Collector({
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        location: {
          lat: null,
          lng: null,
        },
        rating: 5.0,
        isAvailable: true,
        createdAt: new Date(),
      });

      await newCollector.save();
    }

    const safeUser = newUser.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.status(201).json({
      message: 'User registered successfully',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    return res.json({
      message: 'Login successful',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Error logging in:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(payload.sub);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = buildAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    console.error('Error refreshing token:', err.message);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Error logging out:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


