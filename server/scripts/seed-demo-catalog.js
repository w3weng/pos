const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'products');

const categoryCatalog = [
    {
        name: 'Shampoo',
        description: 'Hair care essentials and treatment shampoos',
        colorA: '#1d4ed8',
        colorB: '#38bdf8',
        accent: '#f8fafc',
        products: [
            ['Head & Shoulders Cool Menthol 170ml', 'Anti-dandruff shampoo with a cooling menthol finish', 120, 149, 24, 6],
            ['Palmolive Naturals Silky Straight 180ml', 'Daily shampoo for smoother and softer hair', 112, 139, 20, 5],
            ['Sunsilk Smooth & Manageable Pink 180ml', 'Salon-inspired smoothing shampoo for everyday use', 118, 145, 18, 5],
            ['Cream Silk Damage Control 180ml', 'Repair-focused shampoo for dry and damaged hair', 126, 155, 16, 4],
            ['Pantene Total Damage Care 170ml', 'Strengthening shampoo for brittle hair strands', 128, 159, 14, 4],
            ["Johnson's Baby Shampoo 100ml", 'Gentle no-tears shampoo for babies and sensitive scalps', 92, 119, 22, 6],
            ['Dove Intense Repair 170ml', 'Moisturizing shampoo with keratin repair formula', 130, 162, 15, 4],
            ['Clear Men Cool Sport Menthol 170ml', 'Refreshing anti-dandruff shampoo for active lifestyles', 124, 154, 17, 4],
            ['Rejoice Rich Smooth 170ml', 'Conditioning shampoo for silky manageable hair', 110, 136, 19, 5],
            ['Palmolive Naturals Anti-Hairfall 180ml', 'Shampoo blend designed to help reduce hair fall', 116, 142, 18, 5],
        ],
    },
    {
        name: 'Soap',
        description: 'Bath soaps, beauty bars, and antibacterial soap options',
        colorA: '#0f766e',
        colorB: '#2dd4bf',
        accent: '#ecfeff',
        products: [
            ['Safeguard Lemon Fresh 135g', 'Antibacterial bath soap with fresh lemon scent', 28, 36, 40, 10],
            ['Dove White Beauty Bar 90g', 'Moisturizing beauty bar for softer skin', 40, 52, 32, 8],
            ['Bioderm Coolness 135g', 'Refreshing germ protection soap with cooling feel', 31, 39, 28, 7],
            ['Irish Spring Original 113g', 'Classic deodorant soap with long-lasting freshness', 45, 59, 20, 5],
            ['Hygienix Germicidal Soap 90g', 'Germicidal cleansing soap for daily hygiene', 33, 43, 26, 6],
            ["Johnson's Milk + Rice Bath Soap 100g", 'Mild nourishing bath soap for delicate skin', 29, 38, 22, 6],
            ['Silka Papaya Whitening Soap 135g', 'Papaya-based soap for brighter-looking skin', 42, 55, 18, 5],
            ['Kojie.san Skin Lightening Soap 65g', 'Cult-favorite kojic acid soap for body care', 48, 62, 16, 4],
            ['Perla Pure Coconut Soap 95g', 'Coconut oil soap known for gentle cleansing', 24, 31, 24, 6],
            ['Lifebuoy Total 10 85g', 'Family antibacterial soap for everyday germ protection', 26, 34, 30, 8],
        ],
    },
    {
        name: 'Snacks',
        description: 'Popular chips, crackers, and ready-to-eat snack favorites',
        colorA: '#b45309',
        colorB: '#f59e0b',
        accent: '#fffbeb',
        products: [
            ['Piattos Cheese 85g', 'Thin potato crisps with rich cheese flavor', 34, 46, 32, 8],
            ['Nova Country Cheddar 78g', 'Crunchy corn snack with cheddar taste', 28, 39, 30, 8],
            ['Clover Chips Barbecue 85g', 'Corn chips with smoky barbecue seasoning', 30, 41, 26, 7],
            ['Boy Bawang Garlic Cornick 100g', 'Crunchy garlic-flavored cornick snack', 26, 37, 24, 6],
            ['Roller Coaster Cheddar 85g', 'Ring-shaped corn snack with cheesy bite', 29, 40, 24, 6],
            ['Oishi Prawn Crackers 90g', 'Crisp shrimp-flavored crackers for sharing', 27, 38, 28, 7],
            ['Mang Juan Chicharron Regular 90g', 'Savory chicharron snack with signature crunch', 30, 42, 22, 6],
            ['Ding Dong Mixed Nuts 95g', 'Classic mixed nuts with crunchy corn bits', 38, 52, 18, 5],
            ['SkyFlakes Crackers 10-pack', 'Light crispy crackers for breakfast or merienda', 45, 59, 20, 5],
            ['Rebisco Crackers Sandwich', 'Sweet sandwich crackers for lunchbox snacking', 18, 26, 35, 10],
        ],
    },
    {
        name: 'Beverages',
        description: 'Soft drinks, bottled water, juices, and ready-to-drink refreshers',
        colorA: '#7c3aed',
        colorB: '#a78bfa',
        accent: '#f5f3ff',
        products: [
            ['Coca-Cola Mismo 300ml', 'Classic cola in convenient small bottle', 18, 25, 30, 8],
            ['Pepsi 320ml', 'Cola soda with bold refreshing taste', 18, 25, 28, 8],
            ['Sprite 500ml', 'Lemon-lime soda served ice cold', 22, 30, 26, 7],
            ['Royal Tru-Orange 500ml', 'Orange soda with sweet citrus sparkle', 22, 30, 24, 7],
            ['Mountain Dew 500ml', 'Citrus soda with energizing kick', 24, 32, 22, 6],
            ['C2 Apple Green Tea 500ml', 'Ready-to-drink green tea with apple flavor', 23, 31, 25, 7],
            ['Pocari Sweat 500ml', 'Electrolyte drink for hydration support', 32, 42, 16, 4],
            ['Wilkins Pure Water 500ml', 'Bottled drinking water for everyday refreshment', 10, 15, 40, 12],
            ['Mug Root Beer 355ml', 'Sweet root beer with creamy soda finish', 20, 28, 18, 5],
            ['Nestea Lemon Iced Tea 500ml', 'Lemon iced tea ready for grab-and-go', 21, 29, 20, 6],
        ],
    },
    {
        name: 'Canned Goods',
        description: 'Shelf-stable canned meal staples and pantry ingredients',
        colorA: '#991b1b',
        colorB: '#ef4444',
        accent: '#fef2f2',
        products: [
            ['Century Tuna Hot & Spicy 155g', 'Protein-packed tuna flakes with spicy kick', 42, 55, 20, 5],
            ['555 Sardines Tomato Sauce 155g', 'Classic canned sardines in tomato sauce', 20, 28, 35, 10],
            ['Argentina Corned Beef 150g', 'Breakfast favorite canned corned beef', 36, 48, 22, 6],
            ['Mega Sardines Green 155g', 'Sardines in tomato sauce with chili notes', 19, 27, 30, 9],
            ['Ligo Sardines Extra Hot 155g', 'Spicy sardines for quick ulam meals', 21, 29, 28, 8],
            ['Purefoods Vienna Sausage 230g', 'Ready-to-heat sausage bites in can', 44, 58, 18, 5],
            ['San Marino Corned Tuna 180g', 'Corned tuna good for sandwiches or rice meals', 38, 50, 20, 5],
            ['Del Monte Spaghetti Sauce 250g', 'Sweet-style spaghetti sauce for fast pasta nights', 33, 44, 16, 4],
            ['Jolly Whole Mushrooms 184g', 'Whole button mushrooms for soups and stir-fry', 46, 60, 14, 4],
            ["Hunt's Pork and Beans 230g", 'Sweet tomato pork and beans pantry staple', 29, 39, 18, 5],
        ],
    },
    {
        name: 'Dairy',
        description: 'Milk, cream, spreads, cultured drinks, and dairy-based essentials',
        colorA: '#0f172a',
        colorB: '#64748b',
        accent: '#f8fafc',
        products: [
            ['Bear Brand Powdered Milk 150g', 'Fortified powdered milk for family nutrition', 52, 68, 18, 5],
            ['Alaska Evaporada 370ml', 'Evaporated filled milk for coffee and cooking', 34, 45, 20, 6],
            ['Nestle Fresh Milk 1L', 'Chilled fresh milk for breakfast and baking', 78, 99, 12, 3],
            ['Dutch Mill Yogurt Drink Strawberry', 'Cultured milk drink with strawberry flavor', 18, 24, 24, 6],
            ['Yakult Probiotic 5-pack', 'Small probiotic drink bottles for gut-friendly refreshment', 42, 55, 16, 4],
            ['Arla Full Cream Milk 1L', 'Rich full cream milk for the whole family', 88, 112, 10, 3],
            ['Cheez Whiz Pimiento 210g', 'Cheese spread for bread and snacks', 72, 89, 12, 3],
            ['Magnolia Fresh Milk 250ml', 'Single-serve fresh milk bottle for grab-and-go', 24, 32, 20, 5],
            ['Nestle All Purpose Cream 250ml', 'Cream for desserts, pasta, and savory dishes', 45, 58, 14, 4],
            ['Anchor Butter 227g', 'Creamy butter block for cooking and baking', 122, 149, 8, 2],
        ],
    },
    {
        name: 'Coffee',
        description: 'Ground coffee, instant mixes, and ready-to-brew coffee favorites',
        colorA: '#5b3716',
        colorB: '#a16207',
        accent: '#fefce8',
        products: [
            ['Nescafe Classic Refill 100g', 'Instant coffee refill for daily brewing', 118, 145, 12, 3],
            ['Great Taste White 3-in-1 10-pack', 'Creamy sweet white coffee sachets', 58, 75, 20, 5],
            ['Kopiko Brown Coffee 10-pack', 'Brown coffee blend with balanced sweetness', 60, 78, 18, 5],
            ['Old Town White Coffee Classic 10-pack', 'Smooth Malaysian-style white coffee mix', 92, 118, 10, 3],
            ['UCC 3-in-1 Strong 10-pack', 'Bold instant coffee mix with strong roast taste', 84, 105, 10, 3],
            ['San Mig Coffee Original 10-pack', 'Everyday 3-in-1 coffee mix for busy mornings', 55, 72, 16, 4],
            ['Nescafe Creamy White 10-pack', 'Light creamy coffee mix for mellow mornings', 56, 73, 16, 4],
            ['Cafe Puro Barako Blend 250g', 'Ground barako blend for drip or press brewing', 138, 169, 8, 2],
            ['Essenso 3-in-1 Original 8-pack', 'Rich aromatic coffee blend in convenient sachets', 76, 96, 12, 3],
            ['Maxim Mocha Gold Mild 12-pack', 'Smooth Korean coffee mix with gentle sweetness', 82, 104, 10, 3],
        ],
    },
    {
        name: 'Household',
        description: 'Cleaning and laundry staples for everyday home care',
        colorA: '#065f46',
        colorB: '#10b981',
        accent: '#ecfdf5',
        products: [
            ['Joy Dishwashing Liquid Lemon 250ml', 'Grease-cutting dishwashing liquid with lemon scent', 46, 60, 18, 5],
            ['Surf Powder Detergent 500g', 'Powder detergent with long-lasting fragrance', 52, 68, 16, 4],
            ['Tide Powder Original 500g', 'Strong stain-removing laundry detergent powder', 58, 75, 14, 4],
            ['Downy Sunrise Fresh 180ml', 'Fabric conditioner with fresh floral scent', 32, 42, 20, 5],
            ['Zonrox Bleach Original 500ml', 'Trusted bleach and disinfecting solution', 24, 33, 24, 6],
            ['Mr. Muscle Glass Cleaner 500ml', 'Glass cleaner for streak-free shine', 72, 92, 10, 3],
            ['Domex Multi-Purpose Cleaner 500ml', 'Cleaner for bathroom and floor sanitation', 65, 84, 10, 3],
            ['Scotch-Brite Scrub Sponge 2-pack', 'Scrub sponge duo for kitchen cleaning', 36, 48, 18, 5],
            ['Pride Fabric Conditioner 180ml', 'Budget-friendly fabric conditioner refill', 28, 37, 22, 6],
            ['Champion Detergent Bar 140g', 'Laundry bar soap for pre-treating stains', 18, 25, 26, 7],
        ],
    },
    {
        name: 'Frozen Foods',
        description: 'Frozen meats, ready-to-cook meals, and family freezer staples',
        colorA: '#1e3a8a',
        colorB: '#60a5fa',
        accent: '#eff6ff',
        products: [
            ['Purefoods Tender Juicy Hotdog 1kg', 'Classic red hotdogs for breakfast or merienda', 138, 169, 10, 3],
            ['Magnolia Chicken Nuggets 200g', 'Breaded chicken nuggets for easy snacking', 82, 105, 14, 4],
            ['Bounty Fresh Chicken Tocino 450g', 'Sweet cured chicken tocino for breakfast meals', 118, 145, 10, 3],
            ['Virginia Chicken Timplados 1kg', 'Seasoned chicken cuts ready for frying', 172, 205, 8, 2],
            ['SM Bonus French Fries 1kg', 'Frozen straight-cut fries for home frying', 88, 112, 10, 3],
            ['Magnolia Pork Siomai 20pcs', 'Frozen pork siomai for steaming or frying', 96, 122, 12, 3],
            ['Holiday Ham Slices 250g', 'Ham slices for sandwiches and breakfast plates', 105, 132, 10, 3],
            ['Monterey Beef Tapa 300g', 'Ready-to-cook beef tapa with savory marinade', 132, 160, 8, 2],
            ['San Miguel Frozen Burger Patty 500g', 'Burger patties for quick family meals', 110, 138, 10, 3],
            ['Arce Dairy Vanilla Ice Cream 1.5L', 'Creamy vanilla ice cream tub for dessert time', 182, 220, 6, 2],
        ],
    },
    {
        name: 'Personal Care',
        description: 'Toothpaste, deodorants, sanitary care, and daily grooming essentials',
        colorA: '#be185d',
        colorB: '#f472b6',
        accent: '#fdf2f8',
        products: [
            ['Colgate Total Clean Mint 150g', 'Mint toothpaste for all-around oral care', 78, 99, 16, 4],
            ['Closeup Deep Action 160g', 'Gel toothpaste with cooling mouthwash beads', 76, 96, 16, 4],
            ['Oral-B Fresh Clean Toothbrush', 'Soft-bristle toothbrush for daily brushing', 34, 45, 20, 5],
            ['Master Facial Wash Oil Control 100ml', 'Face wash formulated for oily skin', 89, 112, 12, 3],
            ['Nivea Men Cool Kick Roll-On 50ml', 'Roll-on deodorant with cooling freshness', 118, 145, 10, 3],
            ['Rexona Women Powder Dry 50ml', 'Reliable antiperspirant for everyday wear', 104, 132, 10, 3],
            ['Modess Day Pads 8s', 'Comfortable sanitary pads for daily protection', 42, 56, 18, 5],
            ['Whisper Regular Flow 8s', 'Trusted sanitary pads for regular flow days', 44, 58, 18, 5],
            ["Johnson's Baby Powder 100g", 'Classic baby powder with gentle clean scent', 39, 52, 20, 5],
            ['Biogenic Alcohol 250ml', 'Multi-use rubbing alcohol for hygiene care', 32, 42, 22, 6],
        ],
    },
];

const getStoreIdFromArgs = () => {
    const storeArgument = process.argv.find((argument) => argument.startsWith('--store='));

    if (!storeArgument) {
        return null;
    }

    const parsedStoreId = Number(storeArgument.split('=')[1]);
    return Number.isFinite(parsedStoreId) && parsedStoreId > 0 ? parsedStoreId : null;
};

const slugify = (value) =>
    String(value)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');

const escapeXml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const wrapLine = (value, maxLength = 20) => {
    const words = String(value).split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;

        if (candidate.length <= maxLength) {
            currentLine = candidate;
            continue;
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        currentLine = word;
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.slice(0, 3);
};

const createProductSvg = ({ categoryName, productName, colorA, colorB, accent, sku, sellingPrice }) => {
    const nameLines = wrapLine(productName, 18);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="120" y1="80" x2="1080" y2="1120" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colorA}"/>
      <stop offset="1" stop-color="${colorB}"/>
    </linearGradient>
    <filter id="shadow" x="0" y="0" width="1200" height="1200" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="30" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="1200" height="1200" rx="80" fill="url(#bg)"/>
  <circle cx="980" cy="220" r="150" fill="${accent}" fill-opacity="0.18"/>
  <circle cx="170" cy="1020" r="180" fill="${accent}" fill-opacity="0.14"/>
  <rect x="86" y="82" width="1028" height="1036" rx="56" fill="#0f172a" fill-opacity="0.12"/>
  <g filter="url(#shadow)">
    <rect x="126" y="126" width="948" height="948" rx="48" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.3" stroke-width="2"/>
  </g>
  <text x="160" y="220" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700" letter-spacing="3">
    ${escapeXml(categoryName.toUpperCase())}
  </text>
  <text x="160" y="315" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="700">
    ${nameLines.map((line, index) => `<tspan x="160" dy="${index === 0 ? 0 : 108}">${escapeXml(line)}</tspan>`).join('')}
  </text>
  <text x="160" y="860" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="600">
    SKU ${escapeXml(sku)}
  </text>
  <text x="160" y="930" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">
    PHP ${escapeXml(sellingPrice.toFixed(2))}
  </text>
  <rect x="760" y="820" width="220" height="220" rx="44" fill="${accent}" fill-opacity="0.2"/>
  <path d="M825 948C825 907.131 858.131 874 899 874C939.869 874 973 907.131 973 948C973 988.869 939.869 1022 899 1022C858.131 1022 825 988.869 825 948Z" fill="${accent}" fill-opacity="0.88"/>
  <path d="M878 948L893 963L923 933" stroke="${colorA}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
};

const ensureCategory = async (storeId, category) => {
    const [result] = await pool.query(
        `
        INSERT INTO categories (store_id, name, description, is_active)
        VALUES (?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            description = VALUES(description),
            is_active = 1
        `,
        [storeId, category.name, category.description]
    );

    return result.insertId;
};

const upsertProduct = async (storeId, categoryId, product) => {
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
            image_url,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            category_id = VALUES(category_id),
            name = VALUES(name),
            description = VALUES(description),
            barcode = VALUES(barcode),
            purchase_price = VALUES(purchase_price),
            selling_price = VALUES(selling_price),
            image_url = VALUES(image_url),
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
            product.imageUrl,
        ]
    );
};

const buildCatalogProducts = () => {
    const products = [];
    let productNumber = 1;

    categoryCatalog.forEach((category, categoryIndex) => {
        category.products.forEach((entry, productIndex) => {
            const [name, description, purchasePrice, sellingPrice, quantityInStock, reorderLevel] = entry;
            const sku = `CAT${String(categoryIndex + 1).padStart(2, '0')}-${String(productIndex + 1).padStart(2, '0')}`;
            const barcode = `4800012${String(productNumber).padStart(6, '0')}`;
            const fileName = `demo-${String(productNumber).padStart(3, '0')}-${slugify(name)}.svg`;

            products.push({
                categoryName: category.name,
                name,
                description,
                sku,
                barcode,
                purchasePrice,
                sellingPrice,
                quantityInStock,
                reorderLevel,
                imageFileName: fileName,
                imageUrl: `/uploads/products/${fileName}`,
                theme: {
                    colorA: category.colorA,
                    colorB: category.colorB,
                    accent: category.accent,
                },
            });

            productNumber += 1;
        });
    });

    return products;
};

const writeProductImages = (products) => {
    fs.mkdirSync(uploadDirectory, { recursive: true });

    for (const product of products) {
        const svgMarkup = createProductSvg({
            categoryName: product.categoryName,
            productName: product.name,
            colorA: product.theme.colorA,
            colorB: product.theme.colorB,
            accent: product.theme.accent,
            sku: product.sku,
            sellingPrice: product.sellingPrice,
        });

        fs.writeFileSync(path.join(uploadDirectory, product.imageFileName), svgMarkup, 'utf8');
    }
};

const main = async () => {
    const requestedStoreId = getStoreIdFromArgs();
    const demoProducts = buildCatalogProducts();

    try {
        const [[store]] = requestedStoreId
            ? await pool.query('SELECT id, name FROM stores WHERE id = ?', [requestedStoreId])
            : await pool.query('SELECT id, name FROM stores ORDER BY id LIMIT 1');

        if (!store) {
            throw new Error('No store found. Create a store first before seeding products.');
        }

        writeProductImages(demoProducts);

        const categoryIdsByName = {};

        for (const category of categoryCatalog) {
            categoryIdsByName[category.name] = await ensureCategory(store.id, category);
        }

        for (const product of demoProducts) {
            await upsertProduct(store.id, categoryIdsByName[product.categoryName], product);
        }

        const [[countRow]] = await pool.query(
            'SELECT COUNT(*) AS total FROM products WHERE store_id = ? AND COALESCE(is_active, 1) = 1',
            [store.id]
        );

        console.log(`Seeded ${demoProducts.length} demo products for store "${store.name}" (store ${store.id}).`);
        console.log(`Store now has ${countRow.total} visible active products.`);
        console.log(`Generated ${demoProducts.length} SVG product images in ${uploadDirectory}.`);
    } finally {
        await pool.end();
    }
};

main().catch((error) => {
    console.error('Failed to seed demo catalog:', error.message);
    process.exit(1);
});
