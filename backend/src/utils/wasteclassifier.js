const mockResults = [
  { category: 'Plastic', icon: '♻️' },
  { category: 'Paper', icon: '📄' },
];

async function classifyWaste(image) {
  return mockResults;
}

module.exports = { classifyWaste };
