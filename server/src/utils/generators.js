const { v4: uuidv4 } = require('uuid');

const generateTransactionId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = uuidv4().split('-')[0].toUpperCase();
    return `TXN-${timestamp}-${randomStr}`;
};

const generateSKU = (categoryId, productName) => {
    const categoryCode = `CAT${categoryId}`.padEnd(5, '0');
    const nameCode = productName.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${categoryCode}-${nameCode}-${timestamp}`;
};

module.exports = {
    generateTransactionId,
    generateSKU
};
