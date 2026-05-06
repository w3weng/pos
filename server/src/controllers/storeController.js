const pool = require('../config/database');

// Get store info
exports.getStoreInfo = async (req, res) => {
    try {
        const [store] = await pool.query(
            'SELECT * FROM stores WHERE id = ?',
            [req.storeId]
        );

        if (!store.length) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        res.json({ success: true, data: store[0] });
    } catch (error) {
        console.error('Get store info error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update store info
exports.updateStoreInfo = async (req, res) => {
    try {
        const { name, address, phone, email, taxRate, currency } = req.body;

        const [result] = await pool.query(
            'UPDATE stores SET name = ?, address = ?, phone = ?, email = ?, tax_rate = ?, currency = ? WHERE id = ?',
            [name, address, phone, email, taxRate, currency, req.storeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'UPDATE', 'STORE', req.storeId, 'Store information updated']
        );

        res.json({ success: true, message: 'Store updated' });
    } catch (error) {
        console.error('Update store info error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
