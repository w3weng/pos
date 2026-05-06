const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const posController = require('../controllers/posController');

// Protect all routes
router.use(authMiddleware);

router.get('/products', posController.getPosProducts);
router.get('/sales/:id', posController.getSale);
router.get('/', posController.getSales);
router.post('/', posController.createSale);
router.post('/:id/void', posController.voidSale);

module.exports = router;
