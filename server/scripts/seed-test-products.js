const pool = require('../src/config/database');

const testCategories = [
    { name: 'Shampoo', description: 'Hair care products' },
    { name: 'Soap', description: 'Bath and body essentials' },
    { name: 'Snacks', description: 'Quick merienda items' },
    { name: 'Beverages', description: 'Cold drinks and refreshments' },
];

const testProducts = [
    {
        category: 'Shampoo',
        name: 'Head & Shoulders Cool Menthol',
        description: 'Anti-dandruff shampoo sachet pack',
        sku: 'PH-SHM-001',
        barcode: '4800011001001',
        purchasePrice: 120,
        sellingPrice: 149,
        quantityInStock: 24,
        reorderLevel: 6,
    },
    {
        category: 'Shampoo',
        name: 'Palmolive Naturals Smooth and Manageable',
        description: 'Everyday shampoo for smooth hair',
        sku: 'PH-SHM-002',
        barcode: '4800011001002',
        purchasePrice: 110,
        sellingPrice: 139,
        quantityInStock: 18,
        reorderLevel: 5,
    },
    {
        category: 'Soap',
        name: 'Safeguard Lemon Fresh',
        description: 'Antibacterial bath soap',
        sku: 'PH-SOP-001',
        barcode: '4800011002001',
        purchasePrice: 28,
        sellingPrice: 36,
        quantityInStock: 40,
        reorderLevel: 10,
    },
    {
        category: 'Snacks',
        name: 'Lucky Me Pancit Canton Chilimansi',
        description: 'Instant noodles favorite snack',
        sku: 'PH-SNK-001',
        barcode: '4800011003001',
        purchasePrice: 14,
        sellingPrice: 20,
        quantityInStock: 55,
        reorderLevel: 12,
    },
    {
        category: 'Beverages',
        name: 'Coca-Cola Mismo',
        description: '300ml soft drink bottle',
        sku: 'PH-BEV-001',
        barcode: '4800011004001',
        purchasePrice: 18,
        sellingPrice: 25,
        quantityInStock: 30,
        reorderLevel: 8,
    },
];

const ensureCategory = async (storeId, category) => {
    const [result] = await pool.query(
        `
        INSERT INTO categories (store_id, name, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            description = VALUES(description),
            is_active = 1
        `,
        [storeId, category.name, category.description]
    );

    return result.insertId;
};

const seedProduct = async (storeId, categoryId, product) => {
    await pool.query(
        `
        INSERT INTO products (
            store_id,
            category_id,
            name,
            description,
            sku,
            barcode,
            purchase_price,
            selling_price,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            category_id = VALUES(category_id),
            name = VALUES(name),
            description = VALUES(description),
            barcode = VALUES(barcode),
            purchase_price = VALUES(purchase_price),
            selling_price = VALUES(selling_price),
            is_active = 1
        `,
        [
            storeId,
            categoryId,
            product.name,
            product.description,
            product.sku,
            product.barcode,
            product.purchasePrice,
            product.sellingPrice,
        ]
    );
};

const main = async () => {
    try {
        const [[store]] = await pool.query('SELECT id, name FROM stores ORDER BY id LIMIT 1');

        if (!store) {
            throw new Error('No store found. Create a store first before seeding products.');
        }

        await pool.query('UPDATE stores SET currency = ? WHERE id = ?', ['PHP', store.id]);

        const categoryIdsByName = {};

        for (const category of testCategories) {
            categoryIdsByName[category.name] = await ensureCategory(store.id, category);
        }

        for (const product of testProducts) {
            await seedProduct(store.id, categoryIdsByName[product.category], product);
        }

        console.log(`Seeded ${testProducts.length} test products for store "${store.name}" with PHP currency.`);
    } finally {
        await pool.end();
    }
};

main().catch((error) => {
    console.error('Failed to seed test products:', error.message);
    process.exit(1);
});
