const express = require('express');
const router = express.Router();
const { classifyWaste } = require('../utils/wasteclassifier');

router.post('/classify', async (req, res) => {
  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({ message: 'Image payload is required' });
    }

    const { results, source } = await classifyWaste(image);

    return res.json({
      results,
      source,
    });
  } catch (error) {
    console.error('Error classifying waste:', error);
    return res.status(500).json({ message: 'Unable to classify waste right now' });
  }
});

module.exports = router;
