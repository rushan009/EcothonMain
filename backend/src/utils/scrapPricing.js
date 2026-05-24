const SCRAP_PRICES = {
  paper: { id: 'paper', label: 'Paper', rate: 15, unit: 'kg', icon: 'description' },
  'soft plastic': { id: 'soft-plastic', label: 'Soft Plastic', rate: 20, unit: 'kg', icon: 'shopping_bag' },
  'hard plastic': { id: 'hard-plastic', label: 'Hard Plastic', rate: 30, unit: 'kg', icon: 'shopping_bag' },
  plastic: { id: 'plastic', label: 'Plastic', rate: 25, unit: 'kg', icon: 'shopping_bag' },
  aluminium: { id: 'aluminium', label: 'Aluminium', rate: 120, unit: 'kg', icon: 'settings' },
  copper: { id: 'copper', label: 'Copper', rate: 350, unit: 'kg', icon: 'currency-usd' },
  'scrap metal': { id: 'scrap-metal', label: 'Scrap Metal', rate: 80, unit: 'kg', icon: 'settings' },
  glass: { id: 'glass', label: 'Glass', rate: 8, unit: 'kg', icon: 'liquor' },
};

const CATEGORY_ALIASES = {
  'aluminum': 'aluminium',
  'aluminium': 'aluminium',
  'aluminum can': 'aluminium',
  'drink can': 'aluminium',
  'foil': 'aluminium',
  'copper wire': 'copper',
  'wire': 'copper',
  'cardboard': 'paper',
  'newspaper': 'paper',
  'book': 'paper',
  'carton': 'paper',
  'corrugated': 'paper',
  'plastic bag': 'soft plastic',
  'wrapper': 'soft plastic',
  'cling film': 'soft plastic',
  'plastic wrap': 'soft plastic',
  'film': 'soft plastic',
  'hard plastic': 'hard plastic',
  'plastic bottle': 'hard plastic',
  'plastic container': 'hard plastic',
  'polypropylene': 'hard plastic',
  'polyethylene': 'hard plastic',
  'pet bottle': 'hard plastic',
  'hdpe': 'hard plastic',
  'pp': 'hard plastic',
  'metal': 'scrap metal',
  'steel': 'scrap metal',
  'iron': 'scrap metal',
  'tin': 'scrap metal',
  'sheet metal': 'scrap metal',
  'scrap metal': 'scrap metal',
  'glass': 'glass',
  'bottle': 'glass',
  'jar': 'glass',
  'glassware': 'glass',
  'plastic': 'plastic',
};

function normalizeCategory(category) {
  if (!category || typeof category !== 'string') {
    return null;
  }

  const sanitized = category.toLowerCase().trim();
  if (!sanitized) {
    return null;
  }

  return CATEGORY_ALIASES[sanitized] || sanitized;
}

function getScrapPriceForCategory(category) {
  const normalized = normalizeCategory(category);

  if (!normalized) {
    return null;
  }

  return SCRAP_PRICES[normalized] || null;
}

function getScrapPrices() {
  return Object.values(SCRAP_PRICES);
}

module.exports = {
  getScrapPriceForCategory,
  getScrapPrices,
};
