# Quick Reference Guide - POS Pro

## 🚀 Start Dev Environment

```bash
# Terminal 1: Backend
cd server
npm install
npm start
# http://localhost:5000

# Terminal 2: Frontend  
cd client
npm install
npm start
# http://localhost:3000
```

## 🔑 Default Login
```
Email: admin@example.com
Password: password123
```

## 📊 Main URLs

| Page | URL | Role |
|------|-----|------|
| Dashboard | http://localhost:3000 | All |
| POS | /pos | Cashier |
| Inventory | /inventory | Manager |
| Products | /products | Manager |
| Sales | /sales | Manager |
| Analytics | /analytics | Manager |
| Users | /users | Admin |
| Settings | /settings | All |

## 💾 Database Commands

```bash
# Connect
mysql -u root -p pos_saas

# Backup
mysqldump -u root -p pos_saas > backup.sql

# Restore
mysql -u root -p pos_saas < backup.sql

# Reset
mysql -u root -p
DROP DATABASE pos_saas;
CREATE DATABASE pos_saas;
SOURCE schema.sql;
```

## 🔍 API Testing

```bash
# Test endpoint
curl -X GET http://localhost:5000/health

# With auth
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/auth/me
```

## 📝 Key Files to Modify

- `server/.env` - Database credentials
- `client/.env` - API URL
- `database/schema.sql` - Database structure
- `server/server.js` - Main backend entry
- `client/src/App.js` - Main frontend entry

## 🛠️ Common Tasks

### Add New API Endpoint
1. Create controller method in `src/controllers/`
2. Add route in `src/routes/`
3. Export in server.js
4. Create API function in `client/src/services/api.js`
5. Use in React component

### Add New Page
1. Create component in `client/src/pages/`
2. Add route in `App.js`
3. Add navigation link in `Sidebar.js`

### Add New Database Table
1. Add SQL to `database/schema.sql`
2. Create controller/routes
3. Update API service

## 🐛 Debug Tips

```js
// Frontend
console.log('debug:', data);
// Browser DevTools -> Console

// Backend
console.error('Error:', error);
// Check terminal output

// Database
SELECT * FROM users;
SHOW TABLES;
DESCRIBE products;
```

## 🔒 User Roles

```
Admin (role_id: 1)
  - Full system access
  - Manage users
  - View all data

Manager (role_id: 2)
  - Inventory management
  - View analytics
  - Generate reports

Cashier (role_id: 3)
  - POS only
  - View daily sales
  - No admin access
```

## 📦 Dependencies

### Backend
- express
- mysql2
- jsonwebtoken
- bcryptjs

### Frontend
- react
- react-router-dom
- tailwindcss
- recharts
- zustand
- axios

## 🚀 Deployment Checklist

- [ ] Change JWT secret
- [ ] Set DB password
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set NODE_ENV=production
- [ ] Use managed DB
- [ ] Enable backups
- [ ] Setup monitoring
- [ ] Test thoroughly

## 💡 Performance Tips

- Add pagination to list endpoints
- Cache API responses
- Use indexes on frequently queried columns
- Debounce search input
- Lazy load images
- Compress assets
- Use CDN for static files

## 🔐 Security Tips

- Validate all inputs
- Use prepared statements
- Hash passwords
- Require HTTPS
- Use strong JWT secret
- Rate limit API
- Log all actions
- Keep dependencies updated

## 📊 Important Tables

```
users - Store users
  id, name, email, password, role_id, store_id

products - Product catalog
  id, name, sku, selling_price, quantity_in_stock

sales - Transactions
  id, transaction_id, total_amount, created_at

inventory_logs - Stock history
  id, product_id, log_type, quantity_change

activity_logs - Audit trail
  id, user_id, action, entity_type, created_at
```

## 🎯 Common Queries

```sql
-- Total sales today
SELECT SUM(total_amount) FROM sales 
WHERE DATE(created_at) = CURDATE();

-- Low stock items
SELECT * FROM products 
WHERE quantity_in_stock <= reorder_level;

-- Top products
SELECT product_id, SUM(quantity) as total 
FROM sale_items GROUP BY product_id 
ORDER BY total DESC LIMIT 10;

-- Recent activity
SELECT * FROM activity_logs 
ORDER BY created_at DESC LIMIT 10;
```

## 🚀 Production Commands

```bash
# Backend
npm install --production
npm start

# Use PM2
pm2 start server.js
pm2 save

# Frontend
npm run build
# Deploy build folder

# Database
mysqldump -u root -p pos_saas > backup.sql
```

## 📱 Testing

### Manual POS Test
1. Login as Cashier
2. Go to POS
3. Search for product
4. Add to cart
5. Increase quantity
6. Apply discount
7. Enter payment
8. Complete sale
9. Print receipt

### Manual Inventory Test
1. Login as Manager
2. Go to Inventory
3. Check stock levels
4. Go to Products
5. Create new product
6. Check Low Stock tab

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| MySQL not running | Start MySQL service |
| Port in use | Kill process or change port |
| API not responding | Check server is running |
| Login fails | Check DB has user |
| CORS error | Update CORS config |
| Token expired | Refresh page, login again |

## 📚 Documentation Files

- `README.md` - Overview
- `GETTING_STARTED.md` - Setup guide
- `DEPLOYMENT.md` - Production setup
- `API_ARCHITECTURE.md` - API docs
- `PROJECT_SUMMARY.md` - Full summary

## 🎓 Learning Path

1. Read README.md
2. Follow GETTING_STARTED.md
3. Setup locally
4. Explore UI
5. Process test sale
6. View analytics
7. Read API_ARCHITECTURE.md
8. Modify code
9. Deploy to production

---

**Save this file for quick reference!** 📌
