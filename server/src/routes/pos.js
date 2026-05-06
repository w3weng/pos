const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const posController = require('../controllers/posController');

// Protect all routes
router.use(authMiddleware);

router.get('/products', posController.getPosProducts);
router.post('/sales', authorize(['Cashier', 'Admin']), posController.createSale);
router.get('/sales/:id', posController.getSale);
router.get('/sales', posController.getSales);
router.post('/sales/:id/void', authorize(['Admin', 'Manager']), posController.voidSale);

module.exports = router;
