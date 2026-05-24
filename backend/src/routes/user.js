const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/dashboard', userController.getDashboard);
router.get('/profile', userController.getProfile);
router.get('/rewards', userController.getRewards);
router.get('/pickups', userController.getPickups);
router.get('/scrap-prices', userController.getScrapPrices);

module.exports = router;
