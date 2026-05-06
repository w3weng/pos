const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// Protect all routes
router.use(authMiddleware);

router.get('/', categoryController.getCategories);
router.post('/', authorize(['Admin', 'Manager']), categoryController.createCategory);
router.put('/:id', authorize(['Admin', 'Manager']), categoryController.updateCategory);
router.delete('/:id', authorize(['Admin', 'Manager']), categoryController.deleteCategory);

module.exports = router;
