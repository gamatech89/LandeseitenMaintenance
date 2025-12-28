# LSM Setup Instructions

## Quick Start (Current State)

The application is **fully set up and ready to use**! Here's what has been done:

### ✅ Completed Setup

1. **Laravel 12 with Breeze (Inertia/React/TypeScript)** - Installed and configured
2. **SQLite Database** - Created and migrated with schema
3. **Database Seeded** - 20 realistic dummy projects with credentials and resources
4. **Ant Design v5** - Installed and integrated with custom theme provider
5. **Dark/Light Theme** - Fully implemented with localStorage persistence
6. **Frontend Built** - Production assets compiled successfully

### 🚀 Running the Application

The Laravel development server is already running at: **http://127.0.0.1:8000**

To access the application:

1. Open your browser and go to: `http://127.0.0.1:8000`
2. Click "Log in" (top right)
3. Use one of these credentials:

    **Admin Access:**

    - Email: `admin@example.com`
    - Password: `password`

    **Manager Access:**

    - Email: `manager@example.com`
    - Password: `password`

    **Viewer Access:**

    - Email: `viewer@example.com`
    - Password: `password`

### 📊 What You'll See

1. **Dashboard** - Traffic light stats showing:

    - 3 Sites Hacked (Critical Alert)
    - 2 Sites Down
    - 3 Sites Compromised
    - Health and Security statistics
    - Recent issues list

2. **Projects Page** - Filterable table with:

    - 20 German company websites
    - Search functionality
    - Filter by Health Status (Online, Down, Updating)
    - Filter by Security Status (Secure, Monitoring, Compromised, Hacked)
    - Color-coded status badges

3. **Project Details** - Tabbed interface with:
    - Overview tab (notes in Markdown)
    - Credentials tab (encrypted passwords with reveal/hide)
    - Resources tab (quick links to Figma, hosting, etc.)

### 🎨 Theme Features

-   Click the **lightbulb icon** in the top-right to toggle dark/light mode
-   Sidebar stays dark for a professional look
-   Theme preference is saved automatically

### 🔒 Security Features

-   All passwords are encrypted using Laravel's Crypt facade
-   Role-based access control (Admin, Manager, Viewer)
-   Copy-to-clipboard for credentials
-   Password visibility toggle

### 📝 Development Notes

**Node.js Version Warning:**

-   Current: Node.js 20.4.0
-   Required: 20.19+ or 22.12+
-   **Impact**: The app works fine! Only affects hot module reloading in dev mode
-   **Workaround**: Frontend assets are already built for production use

**To Rebuild Frontend** (if needed):

```bash
npm run build
```

**To Stop the Server**:
Press `Ctrl+C` in the terminal where `php artisan serve` is running

**To Restart Everything**:

```bash
# Terminal 1
php artisan serve

# Terminal 2 (optional, for hot reload)
npm run dev
```

### 📦 Sample Data

The database contains:

-   **20 Projects** with realistic German company names
-   **Various Status Combinations**:

    -   3 Hacked sites (CRITICAL)
    -   2 Down sites
    -   3 Compromised sites
    -   5 Under monitoring
    -   Rest are secure and online

-   **Credentials**: 2-4 credentials per project (SSH, FTP, DB, WP Admin)
-   **Resources**: 1-3 quick links per project (Figma, Hosting, Analytics)

### 🎯 Next Steps

The core application is complete! Optional enhancements:

1. **Team Management Page** - Create UI for admin to manage users
2. **Vault Global View** - Standalone credential browser
3. **File Uploads** - Add actual file upload for project resources
4. **Edit/Create Forms** - Add CRUD operations for projects
5. **Email Alerts** - Notifications for critical status changes
6. **Activity Log** - Track who viewed/edited what

### 💡 Pro Tips

1. Try the **search function** in Projects - searches name, URL, and email
2. Use **filters** to find all hacked or down sites quickly
3. Click **"View Details"** to see full project information
4. In Project Details, click the **eye icon** to reveal passwords
5. Use **copy icons** to quickly copy credentials

### 🛠️ Troubleshooting

**If the page doesn't load:**

1. Make sure the server is running (`php artisan serve`)
2. Check if port 8000 is available
3. Try `php artisan route:clear` and restart

**If styles look broken:**

1. Run `npm run build`
2. Clear browser cache
3. Check that `public/build` directory exists

**If login doesn't work:**

1. Run `php artisan migrate:fresh --seed` to reset database
2. Use the exact credentials listed above

## Enjoy Your LSM Application! 🎉
