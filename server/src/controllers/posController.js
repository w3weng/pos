const pool = require('../config/database');
const { generateTransactionId } = require('../utils/generators');

const clampDiscountPercent = (value) => {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
        return 0;
    }

    return Math.min(100, Math.max(0, parsedValue));
};

const VALID_PAYMENT_METHODS = new Set(['CASH', 'GCASH', 'MAYA', 'BANK_TRANSFER', 'QR']);
const MAX_ITEM_QUANTITY = 999;
const MAX_SALE_TOTAL = 999999.99;
const completedSaleRequestCache = new Map();
const inFlightSaleRequestKeys = new Set();

const createHttpError = (status, message) => Object.assign(new Error(message), { status });

const normalizePaymentMethod = (value) => {
    const normalizedValue = String(value || 'CASH').trim().toUpperCase().replace(/\s+/g, '_');
    return VALID_PAYMENT_METHODS.has(normalizedValue) ? normalizedValue : null;
};

const normalizeSaleItems = (items) =>
    items.map((item) => ({
        productId: Number(item.productId),
        quantity: Math.trunc(Number(item.quantity)),
        unitPrice: Number(item.unitPrice),
        discountPerItem: Math.max(0, Number(item.discountPerItem) || 0),
    }));

const cacheCompletedSaleResponse = (requestKey, responsePayload) => {
    if (!requestKey) {
        return;
    }

    completedSaleRequestCache.set(requestKey, responsePayload);

    if (completedSaleRequestCache.size > 500) {
        const oldestRequestKey = completedSaleRequestCache.keys().next().value;
        completedSaleRequestCache.delete(oldestRequestKey);
    }
};

// Create sale
exports.createSale = async (req, res) => {
    let connection;

    try {
        const { items, discountAmount, discountPercent, amountPaid, paymentMethod, notes, requestId } = req.body;
        const normalizedRequestId = typeof requestId === 'string' ? requestId.trim() : '';
        const requestKey = normalizedRequestId ? `${req.storeId}:${req.user.id}:${normalizedRequestId}` : '';
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
        const normalizedAmountPaid = Number(amountPaid);

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items required' });
        }

        if (requestKey) {
            if (completedSaleRequestCache.has(requestKey)) {
                return res.status(200).json(completedSaleRequestCache.get(requestKey));
            }

            if (inFlightSaleRequestKeys.has(requestKey)) {
                return res.status(409).json({ success: false, message: 'Sale is already being processed' });
            }
        }

        if (!normalizedPaymentMethod) {
            return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }

        if (!Number.isFinite(normalizedAmountPaid) || normalizedAmountPaid < 0) {
            return res.status(400).json({ success: false, message: 'Invalid payment amount' });
        }

        const normalizedItems = normalizeSaleItems(items);

        if (normalizedItems.some((item) => !item.productId || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || item.quantity <= 0)) {
            return res.status(400).json({ success: false, message: 'Invalid sale items' });
        }

        if (normalizedItems.some((item) => item.quantity > MAX_ITEM_QUANTITY)) {
            return res.status(400).json({ success: false, message: `Maximum quantity per item is ${MAX_ITEM_QUANTITY}` });
        }

        connection = await pool.getConnection();

        if (requestKey) {
            inFlightSaleRequestKeys.add(requestKey);
        }

        await connection.beginTransaction();

        // Calculate totals
        let subtotal = 0;
        for (const item of normalizedItems) {
            subtotal += item.quantity * item.unitPrice;
        }

        const normalizedDiscountPercent = clampDiscountPercent(discountPercent);
        const normalizedDiscountAmount = Number.isFinite(Number(discountAmount)) ? Math.max(0, Number(discountAmount)) : 0;
        const finalDiscount = Math.min(
            subtotal,
            normalizedDiscountPercent > 0 ? (subtotal * normalizedDiscountPercent) / 100 : normalizedDiscountAmount
        );

        // Get store tax rate
        const [stores] = await connection.query('SELECT tax_rate FROM stores WHERE id = ?', [req.storeId]);
        const taxRate = stores[0]?.tax_rate || 0;

        const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
        const [products] = await connection.query(
            'SELECT id, name, COALESCE(is_active, 1) AS is_active FROM products WHERE store_id = ? AND id IN (?)',
            [req.storeId, productIds]
        );
        const productMap = new Map(products.map((product) => [Number(product.id), product]));

        for (const item of normalizedItems) {
            const product = productMap.get(item.productId);

            if (!product || Number(product.is_active) !== 1) {
                throw createHttpError(404, 'One or more products could not be found');
            }

        }

        const taxableAmount = Math.max(0, subtotal - finalDiscount);
        const taxAmount = (taxableAmount * taxRate) / 100;
        const totalAmount = taxableAmount + taxAmount;
        const changeAmount = normalizedAmountPaid - totalAmount;

        if (totalAmount > MAX_SALE_TOTAL) {
            throw createHttpError(400, `Sale total is too high. Maximum allowed is ${MAX_SALE_TOTAL.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        }

        if (changeAmount < 0) {
            throw createHttpError(400, 'Insufficient payment');
        }

        const transactionId = generateTransactionId();

        // Insert sale
        const [saleResult] = await connection.query(
            'INSERT INTO sales (store_id, transaction_id, cashier_id, subtotal, discount_amount, discount_percent, tax_amount, total_amount, amount_paid, change_amount, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.storeId, transactionId, req.user.id, subtotal, finalDiscount, normalizedDiscountPercent, taxAmount, totalAmount, normalizedAmountPaid, changeAmount, normalizedPaymentMethod, notes?.trim() || null]
        );

        const saleId = saleResult.insertId;

        // Insert sale items
        for (const item of normalizedItems) {
            await connection.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_per_item, line_total) VALUES (?, ?, ?, ?, ?, ?)',
                [saleId, item.productId, item.quantity, item.unitPrice, item.discountPerItem, item.quantity * item.unitPrice - item.discountPerItem]
            );
        }

        // Log activity
        await connection.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'CREATE', 'SALE', saleId, `Sale completed: ${transactionId}`]
        );

        await connection.commit();

        const responsePayload = {
            success: true,
            message: 'Sale completed',
            data: {
                id: saleId,
                transactionId,
                subtotal,
                discountAmount: finalDiscount,
                discountPercent: normalizedDiscountPercent,
                taxAmount,
                totalAmount,
                amountPaid: normalizedAmountPaid,
                changeAmount,
                paymentMethod: normalizedPaymentMethod,
                items: normalizedItems.length
            }
        };

        cacheCompletedSaleResponse(requestKey, responsePayload);

        res.status(201).json(responsePayload);
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (_rollbackError) {
                // Ignore rollback errors so we can return the original failure.
            }
        }

        console.error('Create sale error:', error);

        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) {
            connection.release();
        }

        const normalizedRequestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : '';
        const requestKey = normalizedRequestId ? `${req.storeId}:${req.user.id}:${normalizedRequestId}` : '';

        if (requestKey) {
            inFlightSaleRequestKeys.delete(requestKey);
        }
    }
};

// Get sale
exports.getSale = async (req, res) => {
    try {
        const [sales] = await pool.query(
            'SELECT * FROM sales WHERE id = ? AND store_id = ?',
            [req.params.id, req.storeId]
        );

        if (!sales.length) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        const [items] = await pool.query(
            'SELECT si.*, p.name as product_name, p.sku FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...sales[0],
                items
            }
        });
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get sales list
exports.getSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, cashierId, search } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM sales WHERE store_id = ?';
        const params = [req.storeId];

        if (startDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }

        if (cashierId) {
            query += ' AND cashier_id = ?';
            params.push(cashierId);
        }

        if (search) {
            query += ' AND transaction_id LIKE ?';
            params.push(`%${String(search).trim()}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [sales] = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM sales WHERE store_id = ?';
        const countParams = [req.storeId];

        if (startDate) {
            countQuery += ' AND DATE(created_at) >= ?';
            countParams.push(startDate);
        }

        if (endDate) {
            countQuery += ' AND DATE(created_at) <= ?';
            countParams.push(endDate);
        }

        if (cashierId) {
            countQuery += ' AND cashier_id = ?';
            countParams.push(cashierId);
        }

        if (search) {
            countQuery += ' AND transaction_id LIKE ?';
            countParams.push(`%${String(search).trim()}%`);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            data: sales,
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get POS data (products for cart)
exports.getPosProducts = async (req, res) => {
    try {
        const { search = '' } = req.query;

        let query = 'SELECT id, name, sku, barcode, selling_price, image_url, category_id, is_active, 1 AS is_available FROM products WHERE store_id = ? AND COALESCE(is_active, 1) = 1';
        const params = [req.storeId];

        if (search) {
            query += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY is_available DESC, name LIMIT 100';

        const [products] = await pool.query(query, params);

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Get POS products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Void sale
exports.voidSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const normalizedReason = reason?.trim();

        if (!normalizedReason) {
            return res.status(400).json({ success: false, message: 'Void reason is required' });
        }

        // Get sale details
        const [sales] = await pool.query(
            'SELECT * FROM sales WHERE id = ? AND store_id = ?',
            [id, req.storeId]
        );

        if (!sales.length) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        if (sales[0].status === 'VOIDED') {
            return res.status(400).json({ success: false, message: 'Sale is already voided' });
        }

        const voidNote = `VOID DETAILS\nReason: ${normalizedReason}\nVoided by: ${req.user.name}\nVoided at: ${new Date().toISOString()}`;

        // Update sale status
        await pool.query(
            `UPDATE sales
             SET status = "VOIDED",
                 notes = CASE
                     WHEN notes IS NULL OR notes = "" THEN ?
                     ELSE CONCAT(notes, "\n\n", ?)
                 END
             WHERE id = ? AND store_id = ?`,
            [voidNote, voidNote, id, req.storeId]
        );

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (store_id, user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.storeId, req.user.id, 'VOID', 'SALE', id, `Sale voided: ${normalizedReason}`]
        );

        res.json({ success: true, message: 'Sale voided successfully', data: { status: 'VOIDED', notes: voidNote } });
    } catch (error) {
        console.error('Void sale error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
