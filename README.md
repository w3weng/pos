# 💳 POS Pro - Enterprise Point of Sale & Inventory Management SaaS

A production-grade, enterprise-level Point of Sale (POS) and Inventory Management web application designed as a multi-tenant SaaS system for retail businesses.

## 🎯 Features

### Core POS System
- **Real-time POS Transactions**: Fast, responsive checkout interface
- **Product Search**: Instant fuzzy search with barcode support
- **Shopping Cart**: Drag-and-drop cart management with quantity controls
- **Discount System**: Per-item and total discounts
- **Receipt Generation**: Print-ready thermal printer format with PDF export
- **Payment Processing**: Cash, card, check, and other payment methods
- **Transaction Hold/Resume**: Save and resume transactions

### Inventory Management
- **Product Management**: Complete CRUD operations for products
- **Stock Tracking**: Real-time inventory levels
- **Stock In/Out**: Manual stock adjustments with audit trail
- **Low Stock Alerts**: Automatic notifications for low inventory
- **Inventory Logs**: Complete history of all inventory movements
- **Barcode Support**: Built-in barcode scanning simulation

### Business Analytics
- **Dashboard**: Key metrics and KPIs at a glance
- **Sales Trends**: Daily/weekly/monthly sales analysis
- **Top Products**: Best-selling products ranking
- **Revenue by Category**: Category-wise revenue breakdown
- **Cashier Performance**: Individual cashier metrics
- **Comprehensive Reports**: Exportable PDF and CSV reports

### Access Control (RBAC)
- **Admin**: Full system control
- **Manager**: Inventory and analytics management
- **Cashier**: POS access only

### Multi-Store Support
- Scalable multi-tenant architecture
- Separate data for each store
- Store-specific settings and configurations

### Security & Compliance
- JWT Authentication
- Password hashing (bcrypt)
- Activity logging and audit trail
- Login history tracking
- Role-based access control
- Secure API endpoints

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** Database (normalized schema)
- **JWT** Authentication
- **bcryptjs** Password hashing
- **RESTful API** Architecture

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Zustand** for state management
- **Axios** for API calls

### Database
- **MySQL** with proper indexing
- Foreign key relationships
- Audit logging tables

## 📋 Prerequisites

- Node.js 14+ and npm
- MySQL 5.7+
- Git

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create database
mysql -u root -p

# In MySQL CLI
CREATE DATABASE pos_saas;
USE pos_saas;

# Import schema
SOURCE /path/to/database/schema.sql;
```

### 2. Backend Setup

```bash
cd server

# Copy environment file
# Windows Command Prompt:
copy .env.example .env
# PowerShell/macOS/Linux:
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Install dependencies
npm install

# Start server
npm start
# Server will run on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd client

# Copy environment file
# Windows Command Prompt:
copy .env.example .env
# PowerShell/macOS/Linux:
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
# App will run on http://localhost:3000
```

## 📝 Default Login Credentials

```
Email: admin@example.com
Password: password123
```

## 🏗️ Project Structure

```
pos/
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Helper utilities
│   │   └── models/        # Data models
│   ├── server.js          # Main server file
│   └── package.json
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service
│   │   ├── store/         # Zustand store
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilities
│   │   ├── App.js         # Main App component
│   │   └── index.js       # Entry point
│   ├── public/            # Static files
│   └── package.json
├── database/
│   └── schema.sql         # Database schema
└── docs/                  # Documentation

```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new store
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/stock` - Update stock

### POS
- `GET /api/pos/products` - Get POS products (available)
- `POST /api/pos/sales` - Create sale
- `GET /api/pos/sales/:id` - Get sale details
- `GET /api/pos/sales` - List sales
- `POST /api/pos/sales/:id/void` - Void sale

### Inventory
- `GET /api/inventory` - Get inventory
- `GET /api/inventory/logs` - Inventory logs
- `GET /api/inventory/low-stock` - Low stock items
- `POST /api/inventory/stock-in` - Stock in
- `POST /api/inventory/stock-out` - Stock out

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/sales-trend` - Sales trends
- `GET /api/analytics/top-products` - Top products
- `GET /api/analytics/revenue-category` - Revenue by category
- `GET /api/analytics/cashier-performance` - Cashier stats
- `GET /api/analytics/sales-summary` - Sales summary

### Activity Logs
- `GET /api/activity-logs` - Activity logs
- `GET /api/activity-logs/login-history` - Login history

## 🗄️ Database Schema

The system uses a normalized MySQL schema with the following main tables:

- **users** - User accounts
- **roles** - User roles
- **stores** - Store information
- **products** - Product catalog
- **categories** - Product categories
- **sales** - Sales transactions
- **sale_items** - Individual sale items
- **inventory_logs** - Stock movement history
- **activity_logs** - Audit trail
- **login_history** - User login records
- **price_history** - Product price changes
- **sessions** - Active JWT sessions

All tables have proper indexing for performance.

## 🎨 UI/UX Features

- Modern SaaS-style dashboard design (inspired by Stripe, Shopify)
- Dark/Light mode toggle
- Responsive mobile design
- Mobile-first POS interface
- Real-time cart updates
- Smooth animations and transitions
- Accessible color schemes
- Clean, professional typography

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Activity logging for compliance
- Login attempt tracking
- Secure API endpoints with middleware
- CORS configuration
- Input validation on both frontend and backend

## 📊 Performance Features

- Database query optimization with proper indexing
- Pagination for large datasets
- Debounced search input
- Lazy loading for components
- Efficient state management with Zustand
- Response caching where appropriate

## 🚢 Deployment

### Backend Deployment (Heroku/AWS)

1. Set production environment variables
2. Ensure MySQL database is accessible
3. Deploy with `npm start`
4. Use process manager like PM2 for production

### Frontend Deployment (Vercel/Netlify)

1. Build: `npm run build`
2. Deploy the `build/` folder
3. Set `REACT_APP_API_URL` to production API URL

## 📈 Future Enhancements

- Inventory Forecasting
- Supplier Management
- Multi-location inventory sync
- Advanced Reporting & BI integration
- Customer Loyalty Program
- Recurring Billing
- Mobile POS App
- WhatsApp Integration
- Multi-currency support
- Weight-based products

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Create a feature branch
2. Make your changes
3. Commit with clear messages
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For support, email: support@pospro.com

---

**Built with ❤️ for modern retail businesses**
