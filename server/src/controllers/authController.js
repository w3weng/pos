const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');

const hasRequiredPasswordComplexity = (password) =>
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

// Register new store with admin user
exports.register = async (req, res) => {
    try {
        const { storeName, username, email, password, phone } = req.body;

        if (!storeName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Create store
        const [storeResult] = await pool.query(
            'INSERT INTO stores (name, slug) VALUES (?, ?)',
            [storeName, storeName.toLowerCase().replace(/\s+/g, '-')]
        );

        const storeId = storeResult.insertId;

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create admin user
        const normalizedUsername = (username || email.split('@')[0]).trim().toLowerCase();

        const [userResult] = await pool.query(
            'INSERT INTO users (store_id, role_id, name, username, email, password, phone) VALUES (?, 1, ?, ?, ?, ?, ?)',
            [storeId, storeName, normalizedUsername, email, hashedPassword, phone || null]
        );

        const userId = userResult.insertId;

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [storeId, userId, 'CREATE', 'STORE', storeId, `Store created: ${storeName}`]
        );

        const token = generateToken({ userId, storeId });

        res.status(201).json({
            success: true,
            message: 'Store registered successfully',
            data: {
                store: { id: storeId, name: storeName },
                user: { id: userId, username: normalizedUsername, email },
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { login, email, username, password, storeId } = req.body;
        const loginIdentifier = (login || email || username || '').trim();

        if (!loginIdentifier || !password) {
            return res.status(400).json({ success: false, message: 'Username/email and password required' });
        }

        // Find user
        let query = 'SELECT u.*, r.name as role, s.id as store_id FROM users u JOIN roles r ON u.role_id = r.id JOIN stores s ON u.store_id = s.id WHERE (u.email = ? OR u.username = ?)';
        const params = [loginIdentifier, loginIdentifier];

        if (storeId) {
            query += ' AND u.store_id = ?';
            params.push(storeId);
        }

        const [users] = await pool.query(query, params);

        if (!users.length) {
            return res.status(401).json({ success: false, message: 'No account found for that username or email' });
        }

        const user = users[0];

        if (Number(user.is_active) !== 1) {
            return res.status(403).json({ success: false, message: 'This account is disabled. Contact an admin.' });
        }

        // Compare password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            // Log failed login
            await pool.query(
                'INSERT INTO login_history (user_id, store_id, login_time, status) VALUES (?, ?, NOW(), "FAILED")',
                [user.id, user.store_id]
            );
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Log successful login
        await pool.query(
            'INSERT INTO login_history (user_id, store_id, login_time, status) VALUES (?, ?, NOW(), "SUCCESS")',
            [user.id, user.store_id]
        );

        const token = generateToken({ userId: user.id, storeId: user.store_id });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    storeId: user.store_id
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                id: req.user.id,
                name: req.user.name,
                username: req.user.username,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
                storeId: req.storeId
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, username, email, phone } = req.body;
        const normalizedName = name?.trim();
        const normalizedUsername = username?.trim().toLowerCase();
        const normalizedEmail = email?.trim();

        if (!normalizedName || !normalizedUsername || !normalizedEmail) {
            return res.status(400).json({ success: false, message: 'Name, username, and email are required' });
        }

        await pool.query(
            'UPDATE users SET name = ?, username = ?, email = ?, phone = ? WHERE id = ? AND store_id = ?',
            [normalizedName, normalizedUsername, normalizedEmail, phone?.trim() || null, req.user.id, req.storeId]
        );

        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'UPDATE', 'USER', req.user.id, 'Profile updated']
        );

        res.json({
            success: true,
            message: 'Profile updated',
            data: {
                id: req.user.id,
                name: normalizedName,
                username: normalizedUsername,
                email: normalizedEmail,
                phone: phone?.trim() || null,
                role: req.user.role,
                storeId: req.storeId
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email or username already exists' });
        }

        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!hasRequiredPasswordComplexity(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols'
            });
        }

        // Get user
        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

        if (!users.length) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isValid = await comparePassword(currentPassword, users[0].password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'UPDATE', 'USER', req.user.id, 'Password changed']
        );

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Logout
exports.logout = async (req, res) => {
    try {
        // Update login history
        await pool.query(
            'UPDATE login_history SET logout_time = NOW() WHERE user_id = ? AND logout_time IS NULL ORDER BY id DESC LIMIT 1',
            [req.user.id]
        );

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
