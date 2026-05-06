const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');
const { productImageUpload } = require('../middleware/upload');

// Protect all routes
router.use(authMiddleware);

router.get('/', productController.getProducts);
router.post('/upload-image', authorize(['Admin', 'Manager']), productImageUpload.single('image'), productController.uploadProductImage);
router.get('/:id', productController.getProduct);
router.post('/', authorize(['Admin', 'Manager']), productController.createProduct);
router.put('/:id', authorize(['Admin', 'Manager']), productController.updateProduct);
router.delete('/:id', authorize(['Admin', 'Manager']), productController.deleteProduct);

module.exports = router;
