const pool = require('../config/database');
const { generateSKU } = require('../utils/generators');

const normalizeAvailabilityFlag = (value, fallback = true) => {
    if (value === undefined || value === null || value === '') {
        return fallback ? 1 : 0;
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    const normalizedValue = String(value).trim().toLowerCase();

    if (normalizedValue === '0' || normalizedValue === 'false' || normalizedValue === 'no') {
        return 0;
    }

    return 1;
};

const normalizeImageUrl = (imageUrl) => {
    if (typeof imageUrl !== 'string') {
        return null;
    }

    const trimmedImageUrl = imageUrl.trim();

    if (!trimmedImageUrl) {
        return null;
    }

    if (trimmedImageUrl.startsWith('/uploads/')) {
        return trimmedImageUrl;
    }

    if (trimmedImageUrl.startsWith('http://') || trimmedImageUrl.startsWith('https://')) {
        try {
            const parsedUrl = new URL(trimmedImageUrl);

            if (parsedUrl.pathname.startsWith('/uploads/')) {
                return parsedUrl.pathname;
            }
        } catch (_error) {
            return trimmedImageUrl;
        }
    }

    return trimmedImageUrl;
};

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 1000, search = '', categoryId } = req.query;
        const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
        const normalizedLimit = Math.min(1000, Math.max(1, parseInt(limit, 10) || 1000));
        const offset = (normalizedPage - 1) * normalizedLimit;

        let query = 'SELECT *, COALESCE(is_active, 1) AS is_available FROM products WHERE store_id = ?';
        const params = [req.storeId];

        if (search) {
            query += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (categoryId) {
            query += ' AND category_id = ?';
            params.push(categoryId);
        }

        query += ' ORDER BY name LIMIT ? OFFSET ?';
        params.push(normalizedLimit, offset);

        const [products] = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM products WHERE store_id = ?';
        const countParams = [req.storeId];

        if (search) {
            countQuery += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (categoryId) {
            countQuery += ' AND category_id = ?';
            countParams.push(categoryId);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: products,
            pagination: {
                total: countResult[0].total,
                page: normalizedPage,
                limit: normalizedLimit,
                pages: Math.ceil(countResult[0].total / normalizedLimit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const [product] = await pool.query(
            'SELECT *, COALESCE(is_active, 1) AS is_available FROM products WHERE id = ? AND store_id = ?',
            [req.params.id, req.storeId]
        );

        if (!product.length) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Upload product image
exports.uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image file required' });
        }

        const imageUrl = `/uploads/products/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl,
                filename: req.file.filename,
            },
        });
    } catch (error) {
        console.error('Upload product image error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const { categoryId, name, description, sku, barcode, purchasePrice, sellingPrice, imageUrl, isAvailable } = req.body;
        const normalizedName = name?.trim();

        if (!categoryId || !normalizedName || purchasePrice === undefined || purchasePrice === '' || sellingPrice === undefined || sellingPrice === '') {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const normalizedSku = sku?.trim() || generateSKU(categoryId, normalizedName);
        const normalizedIsAvailable = normalizeAvailabilityFlag(isAvailable, true);
        const normalizedImageUrl = normalizeImageUrl(imageUrl);
        const normalizedDescription = description?.trim() || null;
        const normalizedBarcode = barcode?.trim() || null;

        const [result] = await pool.query(
            'INSERT INTO products (store_id, category_id, name, description, sku, barcode, purchase_price, selling_price, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.storeId, categoryId, normalizedName, normalizedDescription, normalizedSku, normalizedBarcode, purchasePrice, sellingPrice, normalizedImageUrl, normalizedIsAvailable]
        );

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'CREATE', 'PRODUCT', result.insertId, `Product created: ${normalizedName}`]
        );

        res.status(201).json({
            success: true,
            message: 'Product created',
            data: { id: result.insertId, sku: normalizedSku }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'SKU already exists' });
        }

        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryId, name, description, sku, barcode, purchasePrice, sellingPrice, imageUrl, is_active, isAvailable } = req.body;
        const normalizedName = name?.trim();
        const normalizedSku = sku?.trim();

        if (!categoryId || !normalizedName || purchasePrice === undefined || purchasePrice === '' || sellingPrice === undefined || sellingPrice === '' || !normalizedSku) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const [existingProducts] = await pool.query(
            'SELECT id, is_active FROM products WHERE id = ? AND store_id = ?',
            [id, req.storeId]
        );

        if (!existingProducts.length) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const existingProduct = existingProducts[0];
        const hasAvailabilityPreference = isAvailable !== undefined && isAvailable !== null && isAvailable !== '';
        const normalizedIsActive = hasAvailabilityPreference
            ? normalizeAvailabilityFlag(isAvailable, Number(existingProduct.is_active ?? 1) === 1)
            : is_active === undefined || is_active === null
                ? Number(existingProduct.is_active ?? 1)
                : (Number(is_active) === 0 ? 0 : 1);
        const normalizedImageUrl = normalizeImageUrl(imageUrl);
        const normalizedDescription = description?.trim() || null;
        const normalizedBarcode = barcode?.trim() || null;

        await pool.query(
            'UPDATE products SET category_id = ?, name = ?, description = ?, sku = ?, barcode = ?, purchase_price = ?, selling_price = ?, image_url = ?, is_active = ? WHERE id = ? AND store_id = ?',
            [categoryId, normalizedName, normalizedDescription, normalizedSku, normalizedBarcode, purchasePrice, sellingPrice, normalizedImageUrl, normalizedIsActive, id, req.storeId]
        );

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [
                req.storeId,
                req.user.id,
                'UPDATE',
                'PRODUCT',
                id,
                hasAvailabilityPreference
                    ? `Product ${normalizedIsActive === 1 ? 'marked available' : 'marked not available'}: ${normalizedName}`
                    : `Product updated: ${normalizedName}`
            ]
        );

        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'SKU already exists' });
        }

        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE products SET is_active = 0 WHERE id = ? AND store_id = ?',
            [id, req.storeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'DELETE', 'PRODUCT', id, 'Product deleted']
        );

        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

