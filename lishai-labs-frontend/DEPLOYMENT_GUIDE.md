# 🚀 DEPLOYMENT GUIDE - Lishai Labs

## Quick Start for Production

### Prerequisites
- Node.js 18+ installed
- MySQL 5.7+ or MariaDB 10.5+
- SSL Certificate (from Let's Encrypt or provider)
- Domain name
- Server access (DigitalOcean, AWS, Heroku, etc.)

---

## Step 1: Prepare Environment Variables

### Backend .env (Production)
```bash
# Server
PORT=5055
NODE_ENV=production

# Database (use strong passwords!)
DB_HOST=your-db-server.com
DB_PORT=3306
DB_USER=lishai_user (create new, don't use root)
DB_PASSWORD=your-super-strong-password-min-20-chars
DB_NAME=lishai_labs

# JWT (GENERATE NEW SECRET)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRES_IN=7d

# CORS (your production domain)
CLIENT_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# File Uploads
UPLOAD_DIR=/var/www/lishai-labs/uploads

# Email (use App Password for Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=your@gmail.com

# External APIs (optional)
OPENROUTER_API_KEY=your-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### Frontend .env (Production)
```bash
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Step 2: Database Setup

### Create Database User (don't use root!)
```sql
-- Connect as root
mysql -u root -p

-- Create database
CREATE DATABASE lishai_labs;

-- Create user (never use root in production!)
CREATE USER 'lishai_user'@'localhost' IDENTIFIED BY 'your-strong-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON lishai_labs.* TO 'lishai_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SELECT user, host FROM mysql.user WHERE user='lishai_user';
```

### Initialize Database Schema
```bash
# In backend directory
npm run init-db

# This will create all tables
# If you get permission errors, check DB_USER has GRANT permissions
```

---

## Step 3: Build & Deploy

### Frontend Build
```bash
cd lishai-labs-frontend

# Install dependencies
npm install

# Build for production
npm run build

# This creates 'dist' folder with optimized files
# Deploy this to your web server or CDN
```

### Backend Deployment

#### Option A: Traditional Server (DigitalOcean, Linode, etc.)
```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Clone or upload code
cd /var/www
git clone your-repo lishai-labs-backend
cd lishai-labs-backend

# 4. Install dependencies
npm install --production

# 5. Create .env file with production values
nano .env
# (paste production environment variables)

# 6. Initialize database
npm run init-db

# 7. Start with PM2
pm2 start src/server.js --name "lishai-api" --instances max
pm2 startup
pm2 save

# 8. Setup Nginx reverse proxy
# See Nginx section below
```

#### Option B: Heroku Deployment
```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create lishai-labs-api

# 4. Set environment variables
heroku config:set DB_HOST=your-db.com
heroku config:set DB_PASSWORD=your-password
heroku config:set JWT_SECRET=your-generated-secret
# ... etc for all variables

# 5. Add MySQL add-on (if needed)
heroku addons:create cleardb:ignite

# 6. Deploy
git push heroku main
```

#### Option C: Docker Deployment
```bash
# Create Dockerfile in backend
docker build -t lishai-labs-backend .

# Run container
docker run -d \
  -e DB_HOST=your-db \
  -e DB_PASSWORD=your-password \
  -e JWT_SECRET=your-secret \
  -p 5055:5055 \
  --name lishai-api \
  lishai-labs-backend
```

---

## Step 4: Setup Nginx Reverse Proxy

### Install Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/lishai-labs
```

### Paste This Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        root /var/www/lishai-labs/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }
    
    # API (reverse proxy to backend)
    location /api/ {
        proxy_pass http://localhost:5055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Uploads
    location /uploads/ {
        alias /var/www/lishai-labs/uploads/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;
}
```

### Enable and Test
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lishai-labs /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 5: Setup SSL Certificate

### Using Let's Encrypt (FREE)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (runs automatically)
sudo systemctl enable certbot.timer
```

---

## Step 6: Setup Backups

### Automated Database Backups
```bash
# Create backup script
nano /usr/local/bin/backup-lishai.sh
```

### Paste This Script
```bash
#!/bin/bash

BACKUP_DIR="/backups/lishai-labs"
DB_USER="lishai_user"
DB_PASSWORD="your-password"
DB_NAME="lishai_labs"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/lishai-labs/uploads/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Schedule Automatic Backups
```bash
# Make script executable
chmod +x /usr/local/bin/backup-lishai.sh

# Add to crontab
sudo crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-lishai.sh >> /var/log/lishai-backup.log 2>&1
```

---

## Step 7: Setup Monitoring

### Install PM2 Monitoring
```bash
# If using PM2 (recommended)
pm2 install pm2-auto-pull
pm2 install pm2-logrotate

# Monitor logs
pm2 logs lishai-api

# Check status
pm2 status
```

### Setup Error Tracking (Sentry)
```bash
# Install Sentry npm package
cd backend
npm install @sentry/node

# In src/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Step 8: Security Hardening

### Database Security
```bash
# Restrict MySQL connections
sudo ufw allow 3306/tcp from 127.0.0.1

# Or restrict to specific server
sudo ufw allow 3306/tcp from your-app-server
```

### File Permissions
```bash
# Secure upload directory
sudo chmod 755 /var/www/lishai-labs/uploads
sudo chmod 644 /var/www/lishai-labs/uploads/*

# Secure config
sudo chmod 600 /var/www/lishai-labs/.env
```

### Firewall Setup
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 3306/tcp   # MySQL (restricted above)
```

---

## Step 9: Performance Tuning

### Database Optimization
```sql
-- Enable query log to find slow queries
SET GLOBAL slow_query_log = 'ON';

-- Analyze tables
ANALYZE TABLE posts;
ANALYZE TABLE projects;
ANALYZE TABLE opportunities;
ANALYZE TABLE admin_activity_logs;

-- Check indexes
SHOW INDEXES FROM posts;
```

### Node.js Performance
```bash
# In .env
NODE_ENV=production

# Restart with cluster mode
pm2 start src/server.js -i max --name "lishai-api"

# Monitor memory/CPU
pm2 monit
```

### CDN Setup (Optional but Recommended)
```
1. Use Cloudflare (free tier available)
   - Points DNS to your site
   - Caches static files
   - Provides DDoS protection
   - Automatic SSL

2. Upload frontend build to Cloudflare Pages
   - Connect GitHub repo
   - Auto-deploys on push
```

---

## Step 10: Verification Checklist

```
[ ] Database initialized and accessible
[ ] All environment variables set correctly
[ ] SSL certificate installed and working (https://)
[ ] Frontend loads at https://yourdomain.com
[ ] Admin login works
[ ] Posts can be created/edited/deleted
[ ] Search functionality works on all pages
[ ] Activity logs record all actions
[ ] Email notifications send (test)
[ ] File uploads work
[ ] API responds correctly
[ ] Database backups scheduled
[ ] Error tracking configured (optional)
[ ] Monitoring tools active
[ ] Rate limiting working
[ ] CORS configured correctly
[ ] All security headers present
[ ] No console errors in browser
[ ] Mobile responsive on all pages
```

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check credentials
mysql -u lishai_user -p -h localhost

# Check port
netstat -tuln | grep 3306

# Check firewall
sudo ufw status
```

### "API returns 401 Unauthorized"
```bash
# Check JWT_SECRET is set and consistent
echo $JWT_SECRET
# Should output your generated secret
```

### "CORS errors in browser"
```bash
# Check CLIENT_ORIGIN in .env
# Should match your domain exactly:
CLIENT_ORIGIN=https://yourdomain.com

# Restart backend
pm2 restart lishai-api
```

### "Files not uploading"
```bash
# Check upload directory permissions
ls -la /var/www/lishai-labs/uploads
# Should be: drwxr-xr-x (755)

# Check disk space
df -h

# Check UPLOAD_DIR in .env points to correct location
```

### "Nginx 502 Bad Gateway"
```bash
# Check backend is running
pm2 status

# Check port 5055 is accessible
netstat -tuln | grep 5055

# Check nginx logs
tail -f /var/log/nginx/error.log
```

---

## Maintenance Tasks

### Weekly
- [ ] Check error logs
- [ ] Verify backups are running
- [ ] Test admin login
- [ ] Check database size
- [ ] Review activity logs for anomalies

### Monthly
- [ ] Update packages: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Review SSL certificate validity
- [ ] Check server resources (CPU, RAM, disk)
- [ ] Test restore from backup

### Quarterly
- [ ] Update Node.js version
- [ ] Update OS/system packages
- [ ] Security penetration testing
- [ ] Performance optimization review
- [ ] Capacity planning

---

## Support Contacts

- **Database Issues:** Check MySQL error logs
- **API Issues:** Check PM2 logs: `pm2 logs lishai-api`
- **Frontend Issues:** Check browser console (F12)
- **Email Issues:** Test SMTP credentials
- **SSL Issues:** Check Let's Encrypt renewal

---

## Success Criteria

✅ App is production-ready when:
1. HTTPS works (not HTTP)
2. Admin can login with created credentials
3. Can create/edit/delete content
4. Search works on all pages
5. Activity logs show all actions
6. No hardcoded secrets in code
7. Database backups run automatically
8. Error tracking is configured
9. Performance is acceptable (< 2s load)
10. All security headers are present

---

**Version:** 1.0.0
**Last Updated:** 2026-11-25
**Estimated Deployment Time:** 2-4 hours
**Estimated Cost:** $5-50/month (varies by provider)
