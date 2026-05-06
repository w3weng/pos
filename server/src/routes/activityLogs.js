const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const activityLogController = require('../controllers/activityLogController');

// Protect all routes
router.use(authMiddleware);

router.get('/', authorize(['Admin', 'Manager']), activityLogController.getActivityLogs);
router.get('/login-history', authorize(['Admin', 'Manager']), activityLogController.getLoginHistory);

module.exports = router;
