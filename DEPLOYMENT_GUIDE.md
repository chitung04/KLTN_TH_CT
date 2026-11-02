# 🚀 THCT Clinic System - Deployment Guide

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Author**: Nguyễn Thu Hằng, Đỗ Chí Tùng

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Development Setup](#development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Security Checklist](#security-checklist)

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **MySQL**: v8.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space

### Recommended Development Tools
- **IDE**: VS Code, WebStorm, or IntelliJ IDEA
- **API Testing**: Postman or Insomnia
- **Database Client**: MySQL Workbench or TablePlus
- **Git**: Latest version

---

## 🛠️ Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd thct-clinic
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

**Key Dependencies**:
- `express`: ^4.18.2
- `mysql2`: ^3.0.0
- `jsonwebtoken`: ^9.0.0
- `bcryptjs`: ^2.4.3
- `express-rate-limit`: ^6.7.0
- `helmet`: ^7.0.0
- `cors`: ^2.8.5
- `qrcode`: ^1.5.3
- `dotenv`: ^16.0.3

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

**Key Dependencies**:
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `axios`: ^1.4.0
- `html5-qrcode`: ^2.3.0

---

## 💾 Database Setup

### 1. Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE kltn_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kltn_clinic;
```

### 2. Import Schema
```bash
# Import main schema
mysql -u root -p kltn_clinic < database/kltn_clinic.sql

# Import sample data (optional, for testing)
mysql -u root -p kltn_clinic < database/sample_data.sql

# Add additional features
mysql -u root -p kltn_clinic < database/create_rate_limits_table.sql
mysql -u root -p kltn_clinic < database/add_symptoms_column.sql
mysql -u root -p kltn_clinic < database/add_more_doctors.sql
```

### 3. Verify Tables
```sql
USE kltn_clinic;
SHOW TABLES;

-- Should show:
-- users
-- doctors
-- departments
-- appointments
-- medical_records
-- prescriptions
-- auth_audit_logs
-- rate_limits
```

### 4. Create Database User (Production)
```sql
-- Create user for application
CREATE USER 'clinic_app'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kltn_clinic.* TO 'clinic_app'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

---

## ⚙️ Environment Configuration

### Backend Configuration

Create `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kltn_clinic

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=24h

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=5

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=THCT Clinic <noreply@thctclinic.vn>
```

### Frontend Configuration

Create `frontend/.env`:
```env
# API Configuration
REACT_APP_API_BASE=http://localhost:5000/api

# App Configuration
REACT_APP_NAME=THCT Clinic
REACT_APP_VERSION=1.0.0
```

---

## 🏃 Running the Application

### Development Mode

#### 1. Start Backend Server
```bash
cd backend
npm run dev
# or
node src/server.js
```

**Expected Output**:
```
Server is running on http://localhost:5000
Database connected successfully
```

#### 2. Start Frontend Development Server
```bash
cd frontend
npm start
```

**Expected Output**:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

#### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/

### Testing Accounts

After importing sample_data.sql, you can use these test accounts:

**Admin Account**:
- Email: `admin@clinic.com`
- Password: `123456`
- Role: admin

**Doctor Account**:
- Email: `doctor@clinic.com`
- Password: `123456`
- Role: doctor

**Patient Account**:
- Email: `patient@clinic.com`
- Password: `123456`
- Role: patient

**Receptionist Account**:
- Email: `receptionist@clinic.com`
- Password: `123456`
- Role: receptionist

---

## 🌐 Production Deployment

### 1. Build Frontend for Production
```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/build/`.

### 2. Backend Production Configuration

Update `backend/.env` for production:
```env
NODE_ENV=production
PORT=5000

# Use production database credentials
DB_HOST=your_production_db_host
DB_USER=clinic_app
DB_PASSWORD=strong_production_password
DB_NAME=kltn_clinic

# Generate strong JWT secret
JWT_SECRET=use_openssl_rand_base64_32_to_generate_this

# Production CORS
CORS_ORIGIN=https://yourdomain.com
```

### 3. Server Setup Options

#### Option A: Traditional Server (Ubuntu/Debian)

**Install Dependencies**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

**Deploy Backend**:
```bash
# Clone and setup
cd /var/www
git clone <repository-url> thct-clinic
cd thct-clinic/backend

# Install dependencies (production only)
npm install --production

# Start with PM2
pm2 start src/server.js --name thct-clinic-backend
pm2 startup
pm2 save
```

**Deploy Frontend**:
```bash
# Copy build files
sudo cp -r frontend/build/* /var/www/thct-clinic-frontend/

# Configure Nginx
sudo nano /etc/nginx/sites-available/thct-clinic
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/thct-clinic-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable Site and Restart Nginx**:
```bash
sudo ln -s /etc/nginx/sites-available/thct-clinic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**SSL Certificate with Let's Encrypt**:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Option B: Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: kltn_clinic
      MYSQL_USER: clinic_app
      MYSQL_PASSWORD: clinic_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_USER: clinic_app
      DB_PASSWORD: clinic_password
      DB_NAME: kltn_clinic
      JWT_SECRET: production_secret_key
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  mysql_data:
```

Run with Docker:
```bash
docker-compose up -d
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Error**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solutions**:
- Check MySQL is running: `sudo systemctl status mysql`
- Verify database credentials in `.env`
- Test connection: `mysql -u root -p`

#### 2. Port Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### 3. JWT Token Invalid
**Error**: `401 Unauthorized - Invalid token`

**Solutions**:
- Clear browser localStorage
- Re-login to get new token
- Check JWT_SECRET matches between requests

#### 4. CORS Error
**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solutions**:
- Verify CORS_ORIGIN in backend `.env`
- Check frontend is using correct API base URL
- Restart backend server after changing `.env`

#### 5. Build Errors
**Error**: `Module not found` or `Cannot find module`

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

---

## 🔒 Security Checklist

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure firewall rules
- [ ] Disable database root remote access
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Set secure CORS policy
- [ ] Review and minimize error messages
- [ ] Set up logging and monitoring
- [ ] Configure fail2ban for SSH
- [ ] Keep dependencies updated
- [ ] Perform security audit

### Security Best Practices

1. **Passwords**:
   - Use bcrypt with 12+ rounds
   - Enforce strong password policy
   - Never log passwords

2. **JWT Tokens**:
   - Use strong secret (256-bit)
   - Set reasonable expiration (24h)
   - Store tokens securely (httpOnly cookies in production)

3. **Database**:
   - Use parameterized queries (already implemented)
   - Limit database user permissions
   - Regular backups

4. **API**:
   - Implement rate limiting (already configured)
   - Validate all inputs
   - Sanitize user data

5. **Server**:
   - Keep OS and packages updated
   - Use firewall (ufw, iptables)
   - Monitor logs
   - Disable unnecessary services

---

## 📊 Monitoring and Maintenance

### Log Locations

**Backend Logs**:
- Development: Console output
- Production (PM2): `~/.pm2/logs/`

**View PM2 Logs**:
```bash
pm2 logs thct-clinic-backend
```

### Database Backups

**Automated Backup Script** (`backup.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql"
DB_NAME="kltn_clinic"

mkdir -p $BACKUP_DIR
mysqldump -u clinic_app -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Schedule with Cron**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Health Checks

**Backend Health Endpoint**:
```bash
curl http://localhost:5000/
```

**Expected Response**:
```json
{
  "message": "Welcome to THCT Clinic Backend API",
  "status": "running",
  "timestamp": "2024-12-20T10:30:00.000Z"
}
```

---

## 📞 Support

### Getting Help

**Documentation**:
- README.md - Project overview
- FINAL_SUMMARY.md - Complete feature list
- IMPLEMENTATION_STATUS.md - Current status

**Technical Support**:
- Email: support@thctclinic.vn
- Phone: 1900-1234

**Development Team**:
- Nguyễn Thu Hằng
- Đỗ Chí Tùng

**Supervisor**:
- TS. Ngô Hữu Dũng

---

## 📝 Changelog

### Version 1.0.0 (December 2024)
- Initial release
- User authentication system
- Medical records management
- Appointment booking
- QR code check-in
- Role-based dashboards

---

**Last Updated**: December 2024  
**Document Version**: 1.0  
**Status**: Production Ready
