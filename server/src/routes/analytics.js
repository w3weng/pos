const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Protect all routes
router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/sales-trend', analyticsController.getDailySalesTrend);
router.get('/top-products', analyticsController.getTopSellingProducts);
router.get('/revenue-category', analyticsController.getRevenueByCategory);
router.get('/cashier-performance', analyticsController.getCashierPerformance);
router.get('/sales-summary', analyticsController.getSalesSummary);

module.exports = router;
