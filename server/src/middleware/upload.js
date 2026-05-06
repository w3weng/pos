const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const productUploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'products');

fs.mkdirSync(productUploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, productUploadDirectory);
    },
    filename: (_req, file, callback) => {
        const fileExtension = path.extname(file.originalname || '').toLowerCase();
        callback(null, `${uuidv4()}${fileExtension}`);
    },
});

const fileFilter = (_req, file, callback) => {
    if (file.mimetype?.startsWith('image/')) {
        callback(null, true);
        return;
    }

    const error = new Error('Only image uploads are allowed');
    error.status = 400;
    callback(error);
};

const productImageUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = {
    productImageUpload,
};
