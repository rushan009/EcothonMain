const User = require('../models/User');

const resolveUser = async (req) => {
  if (req.user) {
    return req.user;
  }

  const { userId, phone } = req.query || {};
  if (userId) {
    return User.findById(userId);
  }
  if (phone) {
    return User.findOne({ phone });
  }
  return null;
};

const buildScrapPrices = () => [
  { id: 'paper', label: 'Paper', rate: 15, unit: 'kg', trend: 2, icon: 'description' },
  { id: 'plastic', label: 'Plastic', rate: 25, unit: 'kg', trend: 5, icon: 'shopping_bag' },
  { id: 'metal', label: 'Metal', rate: 60, unit: 'kg', trend: -1, icon: 'settings' },
  { id: 'glass', label: 'Glass', rate: 8, unit: 'kg', trend: 0, icon: 'liquor' },
];

const buildRecentPickups = () => [
  { id: 'pk-1024', title: '12kg Multi-waste', date: 'Oct 24', amount: 340, status: 'completed' },
  { id: 'pk-1018', title: '5kg Paper Bundle', date: 'Oct 18', amount: 75, status: 'completed' },
  { id: 'pk-1012', title: '9kg Plastic Mix', date: 'Oct 12', amount: 220, status: 'pending' },
];

exports.getDashboard = async (req, res) => {
  try {
    const user = await resolveUser(req);
    const name = user?.name || 'Rahul';
    const phone = user?.phone || '+977-9800000000';
    const ecoPoints = user?.ecoPoints ?? 750;

    return res.json({
      user: {
        id: user?._id?.toString() || null,
        name,
        phone,
        role: user?.role || 'user',
        ecoPoints,
      },
      ecoScore: ecoPoints,
      ecoTier: 'Eco Warrior',
      impact: {
        co2SavedKg: 124,
        treesSaved: 8.5,
      },
      scrapPrices: buildScrapPrices(),
      recentPickups: buildRecentPickups(),
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ message: 'Failed to load dashboard' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const ecoPoints = user.ecoPoints ?? 0;
    const kgRecycled = Math.max(0, Math.round(ecoPoints / 6));
    const treesSaved = Math.max(0, Math.round(ecoPoints / 15));
    const coins = ecoPoints;

    return res.json({
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      email: user.email || null,
      role: user.role,
      ecoPoints,
      joinedAt: user.createdAt,
      tier: ecoPoints >= 1000 ? 'Eco Champion' : 'Eco Warrior',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZm2HBdwQsBZ8Ap3ad1WjAz9GhSlzMPUYP5Kl2PIhuboPQjSF6OnQE-hSYvAPKG8_k0TuNenzvrodISK2FhJSkAhsT9A_hdc-kUWqZmdMc0xdoZoZaZquSS_FjY0o7C7j3REWQol7RmHmYsv7KipWyJyPNBqwbK5nAeFr-F9mY7Jlt_Juj27CZDDX5JaGt7gfWjH8ne4o4w3ljZI3USinHkMcfIALQxg1z8iKQd9v40yJN2R7bgKpJheEISuCXKn-oeGikullPbV2e',
      stats: {
        kgRecycled,
        coins,
        treesSaved,
      },
      accountSettings: [
        { key: 'details', label: 'Personal Details', icon: 'account-outline', iconTint: 'primary' },
        { key: 'impact', label: 'My Impact History', icon: 'history', iconTint: 'tertiary' },
        { key: 'payment', label: 'Payment Methods', icon: 'wallet-outline', iconTint: 'secondary' },
        { key: 'tips', label: 'Sustainability Tips', icon: 'lightbulb-on-outline', iconTint: 'primary' },
        { key: 'settings', label: 'Settings', icon: 'cog-outline', iconTint: 'muted' },
      ],
      support: {
        title: 'Need Help?',
        description: 'Our support team is available 24/7 to help you with your recycling journey.',
        cta: 'Contact Support',
      },
      supportPhone: '+977-9800000000',
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
};

exports.getRewards = async (_req, res) => {
  return res.json({
    points: 320,
    level: 'Eco Warrior Level 3',
    badges: ['First Pickup', 'Plastic Pioneer', 'E-Waste Hero', 'Paper Champion'],
  });
};

exports.getPickups = async (_req, res) => {
  return res.json({
    pickups: buildRecentPickups(),
  });
};

exports.getScrapPrices = async (_req, res) => {
  return res.json({
    updatedAt: new Date().toISOString(),
    prices: buildScrapPrices(),
  });
};
