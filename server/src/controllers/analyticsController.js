const pool = require('../config/database');

const getSalesScope = (req, alias = 's') => {
    if (req.user?.role !== 'Cashier') {
        return { clause: '', params: [] };
    }

    return { clause: ` AND ${alias}.cashier_id = ?`, params: [req.user.id] };
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        const params = [req.storeId];
        const salesScope = getSalesScope(req);

        if (startDate && endDate) {
            dateFilter = ' AND DATE(s.created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else {
            // Default to today
            dateFilter = ' AND DATE(s.created_at) = CURDATE()';
        }

        params.push(...salesScope.params);

        // Total sales today
        const [salesData] = await pool.query(
            `SELECT COUNT(DISTINCT s.id) as total_orders, SUM(s.total_amount) as total_revenue, SUM(s.change_amount) as total_change 
             FROM sales s WHERE s.store_id = ? AND s.status = 'COMPLETED'${dateFilter}${salesScope.clause}`,
            params
        );

        const [profitData] = await pool.query(
            `SELECT COALESCE(SUM(sale_profit), 0) as total_profit
             FROM (
                SELECT s.id, COALESCE(SUM(si.line_total - (si.quantity * p.purchase_price)), 0) - COALESCE(s.discount_amount, 0) as sale_profit
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                JOIN products p ON si.product_id = p.id
                WHERE s.store_id = ? AND s.status = 'COMPLETED'${dateFilter}${salesScope.clause}
                GROUP BY s.id, s.discount_amount
             ) profit_rows`,
            params
        );

        // Total products
        const [productCount] = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE store_id = ? AND COALESCE(is_active, 1) = 1',
            [req.storeId]
        );

        res.json({
            success: true,
            data: {
                totalOrders: salesData[0]?.total_orders || 0,
                totalRevenue: salesData[0]?.total_revenue || 0,
                totalProfit: profitData[0]?.total_profit || 0,
                lowStockItems: 0,
                totalProducts: productCount[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Daily sales trend
exports.getDailySalesTrend = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const salesScope = getSalesScope(req);

        const [data] = await pool.query(
            `SELECT DATE(s.created_at) as date, SUM(s.total_amount) as total, COUNT(*) as orders 
             FROM sales s WHERE s.store_id = ? AND s.status = 'COMPLETED' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)${salesScope.clause}
             GROUP BY DATE(s.created_at) ORDER BY date ASC`,
            [req.storeId, days, ...salesScope.params]
        );

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get daily sales trend error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Top selling products
exports.getTopSellingProducts = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const normalizedLimit = Math.min(5, Math.max(1, parseInt(limit, 10) || 5));
        const salesScope = getSalesScope(req);

        const [data] = await pool.query(
            `SELECT p.id, p.name, p.sku, SUM(si.quantity) as total_quantity, SUM(si.line_total) as total_revenue
             FROM products p 
             JOIN sale_items si ON p.id = si.product_id
             JOIN sales s ON si.sale_id = s.id
             WHERE p.store_id = ? AND s.status = 'COMPLETED' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)${salesScope.clause}
             GROUP BY p.id ORDER BY total_quantity DESC LIMIT ?`,
            [req.storeId, ...salesScope.params, normalizedLimit]
        );

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get top selling products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Revenue by category
exports.getRevenueByCategory = async (req, res) => {
    try {
        const salesScope = getSalesScope(req);

        const [data] = await pool.query(
            `SELECT c.name, SUM(si.line_total) as revenue, COUNT(si.id) as items_sold
             FROM categories c 
             JOIN products p ON c.id = p.category_id
             JOIN sale_items si ON p.id = si.product_id
             JOIN sales s ON si.sale_id = s.id
             WHERE p.store_id = ? AND s.status = 'COMPLETED' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)${salesScope.clause}
             GROUP BY c.id ORDER BY revenue DESC`,
            [req.storeId, ...salesScope.params]
        );

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get revenue by category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cashier performance
exports.getCashierPerformance = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const normalizedLimit = Math.min(5, Math.max(1, parseInt(limit, 10) || 5));
        const salesScope = getSalesScope(req);

        const [data] = await pool.query(
            `SELECT u.id, u.name, COUNT(s.id) as transactions, SUM(s.total_amount) as total_revenue, AVG(s.total_amount) as avg_transaction
             FROM users u
             JOIN sales s ON u.id = s.cashier_id
             WHERE u.store_id = ? AND s.status = 'COMPLETED' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)${salesScope.clause}
             GROUP BY u.id ORDER BY total_revenue DESC LIMIT ?`,
            [req.storeId, ...salesScope.params, normalizedLimit]
        );

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get cashier performance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Sales summary
exports.getSalesSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = 'SELECT SUM(subtotal) as subtotal, SUM(discount_amount) as total_discount, SUM(tax_amount) as total_tax, SUM(total_amount) as total_revenue FROM sales WHERE store_id = ? AND status = "COMPLETED"';
        let profitQuery = `SELECT COALESCE(SUM(sale_profit), 0) as total_profit
            FROM (
                SELECT s.id, COALESCE(SUM(si.line_total - (si.quantity * p.purchase_price)), 0) - COALESCE(s.discount_amount, 0) as sale_profit
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                JOIN products p ON si.product_id = p.id
                WHERE s.store_id = ? AND s.status = "COMPLETED"`;
        const params = [req.storeId];
        const profitParams = [req.storeId];
        const salesScope = getSalesScope(req);

        if (startDate && endDate) {
            query += ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
            profitQuery += ' AND DATE(s.created_at) BETWEEN ? AND ?';
            profitParams.push(startDate, endDate);
        } else {
            query += ' AND DATE(created_at) = CURDATE()';
            profitQuery += ' AND DATE(s.created_at) = CURDATE()';
        }

        if (salesScope.clause) {
            query += ' AND cashier_id = ?';
            params.push(...salesScope.params);
            profitQuery += salesScope.clause;
            profitParams.push(...salesScope.params);
        }

        profitQuery += ' GROUP BY s.id, s.discount_amount) profit_rows';

        const [data] = await pool.query(query, params);
        const [profitData] = await pool.query(profitQuery, profitParams);

        res.json({
            success: true,
            data: {
                subtotal: data[0]?.subtotal || 0,
                totalDiscount: data[0]?.total_discount || 0,
                totalTax: data[0]?.total_tax || 0,
                totalRevenue: data[0]?.total_revenue || 0,
                totalProfit: profitData[0]?.total_profit || 0
            }
        });
    } catch (error) {
        console.error('Get sales summary error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
