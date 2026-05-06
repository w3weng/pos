const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const storeController = require('../controllers/storeController');

// Protect all routes
router.use(authMiddleware);

router.get('/info', storeController.getStoreInfo);
router.put('/info', authorize(['Admin']), storeController.updateStoreInfo);

module.exports = router;
