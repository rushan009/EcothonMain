export const SCRAP_RATES = [
  { id: 1, name: 'Plastic', nameNp: 'प्लास्टिक', icon: '🥤', rate: 30, unit: 'kg', trend: 'down' },
  { id: 2, name: 'Iron/Steel', nameNp: 'फलाम', icon: '🔩', rate: 45, unit: 'kg', trend: 'stable' },
  { id: 3, name: 'Copper', nameNp: 'तामा', icon: '🔶', rate: 1400, unit: 'kg', trend: 'up' },
  { id: 4, name: 'Aluminium', nameNp: 'एलुमिनियम', icon: '🥫', rate: 120, unit: 'kg', trend: 'up' },
  { id: 5, name: 'Paper/Cardboard', nameNp: 'कागज', icon: '📦', rate: 12, unit: 'kg', trend: 'stable' },
  { id: 6, name: 'E-Waste', nameNp: 'इलेक्ट्रोनिक फोहोर', icon: '⚡', rate: 150, unit: 'kg', trend: 'up' },
  { id: 7, name: 'Glass', nameNp: 'सिसा', icon: '🍶', rate: 8, unit: 'kg', trend: 'down' },
];

export const MOCK_USER = {
  name: 'Priya Sharma',
  phone: '+977-9841234567',
  ecoPoints: 320,
  totalKgRecycled: 45.2,
  treesEquivalent: 3,
  co2Saved: 12.4,
  pickupsCompleted: 18,
};

export const MOCK_COLLECTORS = [
  { id: 1, name: 'Hari Bahadur', rating: 4.8, distance: 1.2, eta: 10, vehicle: 'Motorbike' },
  { id: 2, name: 'Ram Kumar', rating: 4.5, distance: 2.8, eta: 18, vehicle: 'Cycle' },
];

export const USER_PICKUPS = [
  { id: 'P-401', date: '2026-05-20', collector: 'Hari Bahadur', items: 'Plastic + Paper', weight: 5.3, amount: 165, status: 'completed' },
  { id: 'P-398', date: '2026-05-18', collector: 'Ram Kumar', items: 'E-Waste', weight: 1.6, amount: 240, status: 'pending' },
  { id: 'P-395', date: '2026-05-16', collector: 'Hari Bahadur', items: 'Iron', weight: 9.4, amount: 423, status: 'enroute' },
];

export const COLLECTOR_REQUESTS = [
  { id: 'R-101', items: '📦 Paper + 🥤 Plastic', weight: 5.0, distance: 2.3, posted: '5 min ago', area: 'Balaju, Kathmandu', est: 190 },
  { id: 'R-102', items: '⚡ E-Waste', weight: 1.7, distance: 1.4, posted: '2 min ago', area: 'Kalanki, Kathmandu', est: 255 },
  { id: 'R-103', items: '🔩 Iron', weight: 8.2, distance: 3.5, posted: '11 min ago', area: 'Kirtipur', est: 369 },
];

export const ADMIN_KPIS = [
  { label: 'Total Users', value: '1,247', delta: '+12 today', icon: '👤' },
  { label: 'Active Collectors', value: '38', delta: 'Online now', icon: '🚴' },
  { label: 'Pickups Today', value: '94', delta: '+6 vs yesterday', icon: '📦' },
  { label: 'Waste Collected', value: '2,340 kg', delta: 'This month', icon: '🌿' },
];
