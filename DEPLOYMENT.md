# 🚀 POS Pro - Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js 14+ with npm
- MySQL 5.7 or higher
- Git

## Step-by-Step Setup

### 1. Clone and Navigate

```bash
cd c:\xampp\htdocs\pos
```

### 2. Database Setup

```bash
# Create the database
mysql -u root -p

# In MySQL prompt
CREATE DATABASE pos_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pos_saas;
```

Copy the SQL from `database/schema.sql` and paste it into MySQL CLI:

```bash
# Or use command line
mysql -u root -p pos_saas < database/schema.sql
```

### 3. Backend Setup

```bash
cd server

# Copy environment file
# Windows Command Prompt:
copy .env.example .env
# PowerShell/macOS/Linux:
cp .env.example .env

# Edit .env file with your credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=pos_saas

# Install dependencies
npm install

# Start the server
npm start
```

The backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd ../client

# Copy environment file
# Windows Command Prompt:
copy .env.example .env
# PowerShell/macOS/Linux:
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

## 🔐 Initial Setup

### Create Demo Data

After logging in with the registered account, you can:

1. Create product categories
2. Add products to inventory
3. Create user accounts for staff
4. Configure store settings

### First Time Use

1. **Register**: Create your store account on `/register`
2. **Login**: Use your credentials to login
3. **Setup**: Configure store information and initial products
4. **Staff**: Add cashiers and managers
5. **Start**: Begin processing sales!

## 🗄️ Database Backup

```bash
# Backup database
mysqldump -u root -p pos_saas > backup.sql

# Restore database
mysql -u root -p pos_saas < backup.sql
```

## 🐛 Troubleshooting

### Database Connection Error

**Problem**: "Error: connect ECONNREFUSED 127.0.0.1:3306"

**Solution**:
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists

### Port Already in Use

**Problem**: "Error: listen EADDRINUSE :::5000"

**Solution**:
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F
```

### CORS Errors

**Problem**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
- Ensure frontend URL is allowed in backend CORS
- Check API URL in frontend `.env`

### Login Not Working

**Problem**: "Invalid credentials" after registration

**Solution**:
- Check user was created in database
- Verify password was hashed correctly
- Check database connection

## 📱 Testing on Mobile

```bash
# Find your computer's IP
ipconfig

# Access frontend from mobile
http://<YOUR_IP>:3000

# Update API URL if needed
# In client/.env
REACT_APP_API_URL=http://<YOUR_IP>:5000/api
```

## 🔧 Development Tips

### Hot Reload
Both frontend and backend support hot reload with nodemon/react-scripts.

### API Testing
Use Postman or Insomnia to test backend endpoints:
1. Register a store
2. Get JWT token from login
3. Add to Authorization header: `Bearer <token>`

### Database Inspection
```bash
mysql -u root -p pos_saas

# View tables
SHOW TABLES;

# View table structure
DESCRIBE products;

# Query data
SELECT * FROM users;
```

## 🚀 Production Deployment

### Backend (Node.js)

1. Set environment variables:
```
NODE_ENV=production
DB_HOST=prod-db-host
JWT_SECRET=strong-secret-key
```

2. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js
pm2 save
```

3. Deploy on:
- Heroku
- AWS EC2
- DigitalOcean
- Azure App Service

### Frontend (React)

1. Build for production:
```bash
npm run build
```

2. Deploy on:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- Traditional web server

### Database

- Use managed MySQL (AWS RDS, Azure Database, etc.)
- Enable automated backups
- Set up replication for redundancy

## 📊 Performance Optimization

### Backend
- Enable query caching
- Use connection pooling
- Add database indexing
- Implement pagination

### Frontend
- Code splitting
- Lazy loading images
- Compress assets
- Use CDN for static files

## 🔒 Security Checklist

- [ ] Change JWT secret
- [ ] Set strong database password
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Validate all inputs
- [ ] Use environment variables for secrets
- [ ] Regular security audits
- [ ] Keep dependencies updated

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Documentation](https://jwt.io/)

## 🆘 Getting Help

1. Check the README.md for feature overview
2. Review database schema in `database/schema.sql`
3. Check API endpoints in README
4. Review component documentation in code
