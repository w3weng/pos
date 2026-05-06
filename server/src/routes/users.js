const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Protect all routes
router.use(authMiddleware);

// Only Admin can manage users
router.get('/', authorize(['Admin']), userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', authorize(['Admin']), userController.createUser);
router.put('/:id', authorize(['Admin']), userController.updateUser);
router.patch('/:id/enable', authorize(['Admin']), userController.enableUser);
router.delete('/:id', authorize(['Admin']), userController.deleteUser);

module.exports = router;
