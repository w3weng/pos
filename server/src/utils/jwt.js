const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    } catch (error) {
        return null;
    }
};

const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};
