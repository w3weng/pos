const pool = require('../config/database');

// Get all users in store
exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT u.id, u.name, u.username, u.email, u.phone, r.name as role, u.is_active, u.last_login, u.created_at FROM users u JOIN roles r ON u.role_id = r.id WHERE u.store_id = ? ORDER BY u.created_at DESC',
            [req.storeId]
        );

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single user
exports.getUser = async (req, res) => {
    try {
        const [user] = await pool.query(
            'SELECT u.id, u.name, u.username, u.email, u.phone, u.role_id, u.is_active, u.created_at FROM users u WHERE u.id = ? AND u.store_id = ?',
            [req.params.id, req.storeId]
        );

        if (!user.length) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create user (Admin/Manager only)
exports.createUser = async (req, res) => {
    try {
        const { name, username, email, password, phone, roleId } = req.body;
        const normalizedUsername = username?.trim().toLowerCase();

        if (!name || !normalizedUsername || !email || !password || !roleId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { hashPassword } = require('../utils/password');
        const hashedPassword = await hashPassword(password);

        const [result] = await pool.query(
            'INSERT INTO users (store_id, role_id, name, username, email, password, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.storeId, roleId, name, normalizedUsername, email, hashedPassword, phone || null]
        );

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'CREATE', 'USER', result.insertId, `User created: ${name}`]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email or username already exists' });
        }

        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Users can only edit their own profile in Settings'
    });
};

// Enable user
exports.enableUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === Number(req.user.id)) {
            return res.status(400).json({ success: false, message: 'Your own account is already active' });
        }

        const [targetUsers] = await pool.query(
            'SELECT u.id, u.name, u.is_active, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.store_id = ?',
            [id, req.storeId]
        );

        if (!targetUsers.length) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUser = targetUsers[0];

        if (Number(targetUser.is_active) === 1) {
            return res.status(400).json({ success: false, message: 'User is already active' });
        }

        await pool.query('UPDATE users SET is_active = 1 WHERE id = ? AND store_id = ?', [id, req.storeId]);

        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'ENABLE', 'USER', id, `User enabled: ${targetUser.name}`]
        );

        res.json({ success: true, message: 'User enabled', data: { action: 'enabled' } });
    } catch (error) {
        console.error('Enable user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === Number(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot disable your own account' });
        }

        const [targetUsers] = await pool.query(
            'SELECT u.id, u.name, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.store_id = ?',
            [id, req.storeId]
        );

        if (!targetUsers.length) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUser = targetUsers[0];

        if (targetUser.role === 'Admin') {
            return res.status(400).json({ success: false, message: 'Admin accounts cannot be disabled or deleted' });
        }

        const [[activity]] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM sales WHERE cashier_id = ?) +
                (SELECT COUNT(*) FROM activity_logs WHERE user_id = ?) +
                (SELECT COUNT(*) FROM login_history WHERE user_id = ?) +
                (SELECT COUNT(*) FROM sessions WHERE user_id = ?) AS total`,
            [id, id, id, id]
        );

        if (Number(activity.total) === 0) {
            await pool.query('DELETE FROM users WHERE id = ? AND store_id = ?', [id, req.storeId]);

            await pool.query(
                'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
                [req.storeId, req.user.id, 'DELETE', 'USER', id, `User deleted: ${targetUser.name}`]
            );

            return res.json({ success: true, message: 'User deleted because it had no activity', data: { action: 'deleted' } });
        }

        await pool.query('UPDATE users SET is_active = 0 WHERE id = ? AND store_id = ?', [id, req.storeId]);

        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'DISABLE', 'USER', id, `User disabled: ${targetUser.name}`]
        );

        res.json({ success: true, message: 'User disabled because it has activity history', data: { action: 'disabled' } });
    } catch (error) {
        console.error('Disable/delete user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
