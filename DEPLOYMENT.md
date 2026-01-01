# Deployment Guide - Hostinger + MySQL

## Prerequisites

-   Hostinger hosting account (Business or Premium plan recommended)
-   Domain configured in Hostinger
-   SSH access enabled (recommended)
-   Local project fully tested

---

## Step 1: Prepare Local Project for Production

### 1.1 Update Environment Variables

Create a `.env.production` file with your production settings:

```env
APP_NAME="LSM - Landeseiten Management"
APP_ENV=production
APP_KEY=base64:GENERATE_NEW_KEY
APP_DEBUG=false
APP_URL=https://yourdomain.com

# MySQL Database (Hostinger)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# Mail (Optional - configure based on your mail service)
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=your_email@yourdomain.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=your_email@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 1.2 Build Frontend Assets

```bash
# Use Node.js 22
nvm use 22

# Install dependencies and build
npm ci
npm run build
```

### 1.3 Optimize Laravel for Production

```bash
# Clear and cache configurations
php artisan config:clear
php artisan route:clear
php artisan view:clear

# These will be run on the server after deployment
```

---

## Step 2: Create MySQL Database on Hostinger

1. Log into **Hostinger hPanel**
2. Navigate to **Databases → MySQL Databases**
3. Create a new database:
    - Database name: `u123456789_lsm` (prefix is auto-added)
    - Username: `u123456789_lsmuser`
    - Password: Generate a strong password
4. **Save these credentials** - you'll need them for `.env`

---

## Step 3: Prepare Database Migration Script

Since you're migrating from SQLite to MySQL, update the migration for MySQL compatibility.

### 3.1 Update CHECK Constraints for MySQL

The SQLite CHECK constraints need MySQL-compatible syntax. Create a new migration:

```bash
php artisan make:migration update_check_constraints_for_mysql
```

Edit the migration file:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL 8.0.16+ supports CHECK constraints natively
        // For older versions, use ENUM or triggers

        // If using MySQL 8.0.16+, constraints work automatically
        // If using older MySQL, modify the columns to use ENUM:

        if (DB::connection()->getDriverName() === 'mysql') {
            // Check MySQL version
            $version = DB::select('SELECT VERSION() as version')[0]->version;

            if (version_compare($version, '8.0.16', '<')) {
                // For older MySQL, use triggers or application-level validation
                // The application already validates these values
            }
        }
    }

    public function down(): void
    {
        // Nothing to revert
    }
};
```

---

## Step 4: Upload Files to Hostinger

### Option A: Using File Manager (Easier)

1. **Compress your project** (excluding unnecessary files):

```bash
# Create deployment archive
cd /Users/bmarkovic/Documents/Projects/ManagmentApp

# Create a clean deployment folder
mkdir -p ../deploy_temp
rsync -av --progress . ../deploy_temp \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'storage/logs/*' \
  --exclude 'storage/framework/cache/*' \
  --exclude 'storage/framework/sessions/*' \
  --exclude 'storage/framework/views/*' \
  --exclude 'tests' \
  --exclude '.env' \
  --exclude 'database/database.sqlite'

# Create ZIP
cd ../deploy_temp
zip -r ../lsm-deploy.zip .
```

2. **Upload via hPanel File Manager**:
    - Navigate to File Manager → `public_html`
    - Upload `lsm-deploy.zip`
    - Extract the archive

### Option B: Using SSH + Git (Recommended)

1. **Enable SSH Access** in Hostinger hPanel → Advanced → SSH Access
2. **Connect via SSH**:

```bash
ssh u123456789@yourdomain.com -p 65002
```

3. **Clone or upload via Git**:

```bash
cd public_html
git clone https://github.com/gamatech89/LandeseitenMaintenance.git .
```

---

## Step 5: Configure Hostinger Directory Structure

Laravel's `public` folder needs to be the web root. On Hostinger shared hosting:

### 5.1 Restructure for Hostinger

**Method 1: Symlink (if SSH available)**

```bash
# SSH into server
cd ~

# Move Laravel files outside public_html
mv public_html laravel_app

# Create public_html as symlink to Laravel's public folder
ln -s ~/laravel_app/public ~/public_html
```

**Method 2: Modify index.php (Alternative)**

If you can't use symlinks, move only the `public` folder contents:

1. Upload all Laravel files to a folder like `~/laravel_app/`
2. Upload contents of `public/` to `public_html/`
3. Edit `public_html/index.php`:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../laravel_app/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../laravel_app/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../laravel_app/bootstrap/app.php')
    ->handleRequest(Request::capture());
```

---

## Step 6: Install Dependencies on Server

### 6.1 Via SSH

```bash
cd ~/laravel_app  # or public_html if not using symlink method

# Install PHP dependencies (production only)
composer install --no-dev --optimize-autoloader

# Set permissions
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework
```

### 6.2 If No SSH (Use Hostinger's Terminal in hPanel)

Hostinger provides a web terminal in hPanel → Advanced → Terminal

---

## Step 7: Configure Environment

### 7.1 Create .env File

```bash
cp .env.example .env
nano .env  # or use File Manager to edit
```

Update with production values:

```env
APP_NAME="LSM - Landeseiten Management"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123456789_lsm
DB_USERNAME=u123456789_lsmuser
DB_PASSWORD=YOUR_SECURE_PASSWORD

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
```

### 7.2 Generate Application Key

```bash
php artisan key:generate
```

---

## Step 8: Run Database Migrations

```bash
# Run migrations
php artisan migrate --force

# Set seeder password in .env BEFORE seeding
# Add: SEED_PASSWORD=your_secure_password_here

# Seed production data
php artisan db:seed --class=ProductionSeeder --force
```

**Important**: The `SEED_PASSWORD` environment variable MUST be set before running seeders. This password will be used for all initial user accounts.

---

## Step 9: Optimize for Production

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

---

## Step 10: Configure SSL (HTTPS)

1. In Hostinger hPanel → Security → SSL
2. Install free Let's Encrypt SSL certificate
3. Enable "Force HTTPS" redirect

---

## Step 11: Set Up Cron Jobs (Optional)

For Laravel's scheduler, add a cron job in hPanel → Advanced → Cron Jobs:

```
* * * * * cd ~/laravel_app && php artisan schedule:run >> /dev/null 2>&1
```

---

## Deployment Checklist

-   [ ] Database created on Hostinger MySQL
-   [ ] `.env` configured with production values
-   [ ] `APP_DEBUG=false` in production
-   [ ] `APP_ENV=production`
-   [ ] Frontend built (`npm run build`)
-   [ ] Files uploaded to server
-   [ ] Composer dependencies installed (`--no-dev`)
-   [ ] Storage permissions set (755/775)
-   [ ] Application key generated
-   [ ] Database migrations run
-   [ ] Production seeder run
-   [ ] Config/routes/views cached
-   [ ] SSL certificate installed
-   [ ] Force HTTPS enabled

---

## Common Issues & Solutions

### Issue: 500 Internal Server Error

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Fix permissions
chmod -R 755 storage bootstrap/cache
```

### Issue: Session/Cache Not Working

```bash
# Ensure database tables exist
php artisan migrate

# Or use file driver temporarily
SESSION_DRIVER=file
CACHE_STORE=file
```

### Issue: Assets Not Loading (Mixed Content)

Ensure `APP_URL` uses `https://`:

```env
APP_URL=https://yourdomain.com
```

### Issue: CSRF Token Mismatch

Clear browser cookies and ensure session is configured:

```env
SESSION_DRIVER=database
SESSION_DOMAIN=.yourdomain.com
SESSION_SECURE_COOKIE=true
```

### Issue: Database Connection Refused

On Hostinger, use `localhost` not `127.0.0.1`:

```env
DB_HOST=localhost
```

---

## Quick Deploy Script

Save this as `deploy.sh` for future deployments:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes (if using Git)
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queues (if using)
# php artisan queue:restart

echo "✅ Deployment complete!"
```

---

## Post-Deployment Verification

1. Visit `https://yourdomain.com` - should see login page
2. Log in with:
    - Email: `admin@landeseiten.de`
    - Password: _(the SEED_PASSWORD you set in .env)_
3. Test all major features:
    - [ ] Projects list loads
    - [ ] Team page works
    - [ ] Credentials (create/view)
    - [ ] Todos functionality
    - [ ] Notifications

---

## Security Reminders

1. **Change all default passwords** after deployment
2. Set `APP_DEBUG=false` in production
3. Use strong database passwords
4. Enable 2FA on Hostinger account
5. Regular backups via Hostinger hPanel
6. Keep dependencies updated

---

## Hostinger-Specific Notes

-   **PHP Version**: Ensure PHP 8.2+ is selected in hPanel → Advanced → PHP Configuration
-   **PHP Extensions**: Enable `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`
-   **Memory Limit**: Set to at least 256M in PHP Configuration
-   **Max Execution Time**: Set to 300 seconds for migrations

---

## Support

For issues, check:

1. Laravel logs: `storage/logs/laravel.log`
2. PHP error logs in Hostinger hPanel
3. Hostinger support chat (24/7)
