const pool = require('../config/database');

// Get activity logs
exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action, entityType, startDate, endDate, userId } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT al.*, u.name as user_name FROM activity_logs al JOIN users u ON al.user_id = u.id WHERE al.store_id = ?';
        const params = [req.storeId];

        if (action) {
            query += ' AND al.action = ?';
            params.push(action);
        }

        if (entityType) {
            query += ' AND al.entity_type = ?';
            params.push(entityType);
        }

        if (startDate) {
            query += ' AND DATE(al.created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(al.created_at) <= ?';
            params.push(endDate);
        }

        if (userId) {
            query += ' AND al.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [logs] = await pool.query(query, params);

        // Get count
        let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE store_id = ?';
        const countParams = [req.storeId];

        if (action) {
            countQuery += ' AND action = ?';
            countParams.push(action);
        }

        if (entityType) {
            countQuery += ' AND entity_type = ?';
            countParams.push(entityType);
        }

        if (startDate) {
            countQuery += ' AND DATE(created_at) >= ?';
            countParams.push(startDate);
        }

        if (endDate) {
            countQuery += ' AND DATE(created_at) <= ?';
            countParams.push(endDate);
        }

        if (userId) {
            countQuery += ' AND user_id = ?';
            countParams.push(userId);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: logs,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get login history
exports.getLoginHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, startDate, endDate, status } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT lh.*, u.name as user_name FROM login_history lh JOIN users u ON lh.user_id = u.id WHERE lh.store_id = ?';
        const params = [req.storeId];

        if (userId) {
            query += ' AND lh.user_id = ?';
            params.push(userId);
        }

        if (startDate) {
            query += ' AND DATE(lh.login_time) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(lh.login_time) <= ?';
            params.push(endDate);
        }

        if (status) {
            query += ' AND lh.status = ?';
            params.push(status);
        }

        query += ' ORDER BY lh.login_time DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [logs] = await pool.query(query, params);

        // Get count
        let countQuery = 'SELECT COUNT(*) as total FROM login_history WHERE store_id = ?';
        const countParams = [req.storeId];

        if (userId) {
            countQuery += ' AND user_id = ?';
            countParams.push(userId);
        }

        if (startDate) {
            countQuery += ' AND DATE(login_time) >= ?';
            countParams.push(startDate);
        }

        if (endDate) {
            countQuery += ' AND DATE(login_time) <= ?';
            countParams.push(endDate);
        }

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: logs,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get login history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
