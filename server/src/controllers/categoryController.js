const pool = require('../config/database');

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT * FROM categories WHERE store_id = ? AND is_active = 1 ORDER BY name',
            [req.storeId]
        );

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name required' });
        }

        const [result] = await pool.query(
            'INSERT INTO categories (store_id, name, description) VALUES (?, ?, ?)',
            [req.storeId, name, description || null]
        );

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'CREATE', 'CATEGORY', result.insertId, `Category created: ${name}`]
        );

        res.status(201).json({
            success: true,
            message: 'Category created',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const [result] = await pool.query(
            'UPDATE categories SET name = ?, description = ? WHERE id = ? AND store_id = ?',
            [name, description, id, req.storeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'UPDATE', 'CATEGORY', id, `Category updated: ${name}`]
        );

        res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE categories SET is_active = 0 WHERE id = ? AND store_id = ?',
            [id, req.storeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'DELETE', 'CATEGORY', id, 'Category deleted']
        );

        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
