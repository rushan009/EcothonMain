const fs = require('fs');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { getScrapPriceForCategory } = require('./scrapPricing');

const CATEGORY_RULES = [
  {
    category: 'Paper',
    icon: '📄',
    labels: ['paper', 'cardboard', 'newspaper', 'book', 'carton', 'corrugated'],
  },
  {
    category: 'Hard Plastic',
    icon: '🧴',
    labels: ['hard plastic', 'plastic bottle', 'plastic container', 'polypropylene', 'polyethylene', 'pet bottle', 'hdpe', 'pp'],
  },
  {
    category: 'Soft Plastic',
    icon: '🛍️',
    labels: ['soft plastic', 'plastic bag', 'wrapper', 'cling film', 'plastic wrap', 'film', 'sachet'],
  },
  {
    category: 'Aluminium',
    icon: '🔩',
    labels: ['aluminum', 'aluminium', 'aluminum can', 'drink can', 'foil'],
  },
  {
    category: 'Copper',
    icon: '⚙️',
    labels: ['copper', 'copper wire', 'wire'],
  },
  {
    category: 'Scrap Metal',
    icon: '🛠️',
    labels: ['metal', 'steel', 'iron', 'tin', 'scrap metal', 'sheet metal'],
  },
  {
    category: 'Glass',
    icon: '🍶',
    labels: ['glass', 'bottle', 'jar', 'glassware'],
  },
  {
    category: 'Plastic',
    icon: '♻️',
    labels: ['plastic', 'packaging'],
  },
];

const DEFAULT_RESULTS = [
  { category: 'Plastic', icon: '♻️' },
  { category: 'Paper', icon: '📄' },
];

function hasGoogleCredentials() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsPath) {
    return false;
  }

  try {
    return fs.existsSync(credentialsPath);
  } catch (error) {
    console.warn('[wasteclassifier] Unable to verify Google credentials path:', error.message);
    return false;
  }
}

let visionClient = null;

function getVisionClient() {
  if (!hasGoogleCredentials()) {
    return null;
  }

  if (visionClient) {
    return visionClient;
  }

  try {
    visionClient = new ImageAnnotatorClient();
    return visionClient;
  } catch (error) {
    console.warn('[wasteclassifier] Google Vision client unavailable:', error.message);
    visionClient = null;
    return null;
  }
}

function normalizeImage(image) {
  if (!image || typeof image !== 'string') {
    return null;
  }

  const isDataUrl = image.startsWith('data:');

  if (isDataUrl) {
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);

    if (!match) {
      return null;
    }

    return {
      buffer: Buffer.from(match[2], 'base64'),
      mimeType: match[1],
    };
  }

  return {
    buffer: Buffer.from(image, 'base64'),
    mimeType: 'image/jpeg',
  };
}

function normalizeLabels(annotations = []) {
  return annotations
    .map((annotation) => typeof annotation?.description === 'string' ? annotation.description.toLowerCase().trim() : '')
    .filter(Boolean);
}

function enrichResult(result) {
  const price = getScrapPriceForCategory(result.category);

  if (!price) {
    return result;
  }

  return {
    ...result,
    ...price,
  };
}

function buildResultsFromLabels(labels = []) {
  const labelSet = new Set(labels);
  const matched = CATEGORY_RULES.filter((rule) => rule.labels.some((label) => labelSet.has(label)));

  if (matched.length === 0) {
    return DEFAULT_RESULTS.map(enrichResult);
  }

  return matched.map((rule) => enrichResult({
    category: rule.category,
    icon: rule.icon,
  }));
}

async function classifyWaste(image) {
  const parsedImage = normalizeImage(image);

  if (!parsedImage?.buffer?.length) {
    console.warn('[wasteclassifier] No usable image payload received, using fallback results');
    return {
      results: DEFAULT_RESULTS.map(enrichResult),
      source: 'fallback',
    };
  }

  const vision = getVisionClient();

  if (vision) {
    try {
      const [result] = await vision.labelDetection({
        image: { content: parsedImage.buffer },
      });

      const labels = normalizeLabels(result?.labelAnnotations);
      const results = buildResultsFromLabels(labels);

      return {
        results,
        source: 'google-vision',
      };
    } catch (error) {
      console.warn('[wasteclassifier] Google Vision classification failed, using fallback:', error.message);
    }
  }

  return {
    results: DEFAULT_RESULTS.map(enrichResult),
    source: 'fallback',
  };
}

module.exports = { classifyWaste };
