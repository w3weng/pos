# 📖 POS Pro - Architecture & API Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                            │
│  - UI Components (Sidebar, TopBar, Cards)                   │
│  - Pages (Dashboard, POS, Inventory, Sales, etc.)           │
│  - State Management (Zustand)                                │
│  - API Service Layer                                         │
└────────────┬────────────────────────────────────┬────────────┘
             │                                    │
             │ HTTP/REST with JWT                 │ Local Storage
             │                                    │
┌────────────▼────────────────────────────────────▼────────────┐
│                   SERVER (Express.js)                         │
│  - Authentication & Authorization                            │
│  - REST API Endpoints                                        │
│  - Business Logic Controllers                                │
│  - Middleware (Auth, Error Handling)                         │
│  - Database Queries & Operations                             │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ SQL
             │
┌────────────▼──────────────────────────────────────────────────┐
│                   DATABASE (MySQL)                            │
│  - Normalized schema with relationships                       │
│  - Proper indexing for performance                           │
│  - Audit logging tables                                       │
│  - Multi-tenant data isolation                               │
└───────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

#### users
- Stores user information
- Links to roles and stores
- Password hashing for security

#### products
- Product catalog
- SKU and barcode tracking
- Pricing information
- Stock levels

#### sales
- Transaction records
- Payment information
- Discounts and taxes

#### inventory_logs
- Stock movement history
- Type: IN, OUT, SALE, ADJUSTMENT
- Complete audit trail

#### activity_logs
- All system actions logged
- Entity tracking
- Change history

### Relationships

```
stores → users (one-to-many)
stores → products (one-to-many)
stores → sales (one-to-many)
stores → categories (one-to-many)

products → categories (many-to-one)
products → sale_items (one-to-many)
products → inventory_logs (one-to-many)

sales → sale_items (one-to-many)
sales → users (many-to-one) [cashier]

categories → products (one-to-many)

roles → users (one-to-many)
```

## API Documentation

### Authentication Endpoints

#### Register New Store
```
POST /api/auth/register
Body: {
  storeName: string,
  email: string,
  password: string,
  phone?: string
}
Response: { success, user, token }
```

#### Login
```
POST /api/auth/login
Body: {
  email: string,
  password: string,
  storeId?: number
}
Response: { success, user, token }
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, user }
```

#### Change Password
```
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
Body: {
  currentPassword: string,
  newPassword: string
}
Response: { success, message }
```

### Product Endpoints

#### List Products
```
GET /api/products?page=1&limit=20&search=query&categoryId=1
Response: { success, data, pagination }
```

#### Get Product
```
GET /api/products/:id
Response: { success, data }
```

#### Create Product
```
POST /api/products
Body: {
  categoryId: number,
  name: string,
  description?: string,
  sku: string,
  barcode?: string,
  purchasePrice: number,
  sellingPrice: number,
  reorderLevel: number
}
Response: { success, data: { id, sku } }
```

#### Update Product
```
PUT /api/products/:id
Body: { ...same as create }
Response: { success, message }
```

#### Delete Product
```
DELETE /api/products/:id
Response: { success, message }
```

#### Update Stock
```
PATCH /api/products/:id/stock
Body: { quantity: number }
Response: { success, message }
```

### POS Endpoints

#### Get Available Products
```
GET /api/pos/products?search=query
Response: { success, data: [products] }
```

#### Create Sale
```
POST /api/pos/sales
Body: {
  items: [
    {
      productId: number,
      quantity: number,
      unitPrice: number,
      discountPerItem?: number
    }
  ],
  discountAmount?: number,
  discountPercent?: number,
  amountPaid: number,
  paymentMethod: "CASH|CARD|CHECK|OTHER",
  notes?: string
}
Response: {
  success,
  data: {
    id, transactionId, subtotal, totalAmount,
    discountAmount, taxAmount, changeAmount, items
  }
}
```

#### Get Sale
```
GET /api/pos/sales/:id
Response: { success, data: { ...sale, items } }
```

#### List Sales
```
GET /api/pos/sales?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&cashierId=1
Response: { success, data, pagination }
```

#### Void Sale
```
POST /api/pos/sales/:id/void
Body: { reason?: string }
Response: { success, message }
```

### Inventory Endpoints

#### Get Inventory
```
GET /api/inventory?page=1&limit=20&categoryId=1&lowStockOnly=false
Response: { success, data, pagination }
```

#### Get Inventory Logs
```
GET /api/inventory/logs?page=1&limit=20&productId=1&logType=SALE&startDate=2024-01-01
Response: { success, data, pagination }
```

#### Get Low Stock Items
```
GET /api/inventory/low-stock
Response: { success, data, count }
```

#### Stock In
```
POST /api/inventory/stock-in
Body: {
  productId: number,
  quantity: number,
  notes?: string
}
Response: { success, message }
```

#### Stock Out
```
POST /api/inventory/stock-out
Body: {
  productId: number,
  quantity: number,
  notes?: string
}
Response: { success, message }
```

### Analytics Endpoints

#### Dashboard Stats
```
GET /api/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31
Response: {
  success,
  data: {
    totalOrders,
    totalRevenue,
    lowStockItems,
    totalProducts
  }
}
```

#### Daily Sales Trend
```
GET /api/analytics/sales-trend?days=30
Response: { success, data: [{ date, total, orders }] }
```

#### Top Products
```
GET /api/analytics/top-products?limit=10
Response: { success, data: [{ id, name, total_quantity, total_revenue }] }
```

#### Revenue by Category
```
GET /api/analytics/revenue-category
Response: { success, data: [{ name, revenue, items_sold }] }
```

#### Cashier Performance
```
GET /api/analytics/cashier-performance
Response: { success, data: [{ id, name, transactions, total_revenue, avg_transaction }] }
```

#### Sales Summary
```
GET /api/analytics/sales-summary?startDate=2024-01-01&endDate=2024-12-31
Response: {
  success,
  data: { subtotal, totalDiscount, totalTax, totalRevenue }
}
```

### Activity Log Endpoints

#### Get Activity Logs
```
GET /api/activity-logs?page=1&limit=20&action=CREATE&entityType=PRODUCT&userId=1
Response: { success, data, pagination }
```

#### Get Login History
```
GET /api/activity-logs/login-history?page=1&limit=20&userId=1&status=SUCCESS
Response: { success, data, pagination }
```

## State Management (Zustand)

### useAuthStore
- Manages user authentication state
- Stores JWT token
- Persists to localStorage

### useCartStore
- Manages shopping cart items
- Handles cart operations
- Calculates totals and tax

### useThemeStore
- Dark/Light mode toggle
- Persists theme preference

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {} // Only in development
}
```

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Security Considerations

1. **Authentication**: JWT tokens with configurable expiry
2. **Authorization**: Role-based access control on all endpoints
3. **Password**: Bcrypt hashing with salt rounds
4. **Input Validation**: Express validator on all inputs
5. **CORS**: Configured for specific origins
6. **Audit Trail**: All actions logged with timestamps

## Performance Considerations

1. **Database Indexing**: All frequently queried columns indexed
2. **Pagination**: Large result sets paginated
3. **Caching**: API responses can be cached
4. **Connection Pooling**: MySQL connection pool configured
5. **Query Optimization**: Efficient JOINs and SELECT statements
