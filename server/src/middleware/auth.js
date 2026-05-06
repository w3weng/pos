const { verifyToken } = require('../utils/jwt');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        // Get user details from database
        const [user] = await pool.query(
            'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1',
            [decoded.userId]
        );

        if (!user.length) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.user = user[0];
        req.storeId = decoded.storeId;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
};

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
};
