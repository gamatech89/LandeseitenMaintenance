# LSM (Landeseiten Management) - Project Documentation

> Documentation for AI agents and developers working on this project.

## Project Overview

LSM is a web application for managing website maintenance projects, credentials, todos, and team assignments. It's built for a web agency to track client websites, store credentials securely, and manage maintenance tasks.

## Tech Stack

### Backend
- **Framework**: Laravel 12 (PHP 8.2+)
- **Database**: MySQL (production), SQLite (local development)
- **Authentication**: Laravel Breeze with Inertia.js
- **Server-Side Rendering**: Inertia.js

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Ant Design v5
- **Styling**: Tailwind CSS
- **Build Tool**: Vite 7

### Key Packages
- `inertiajs/inertia-laravel` - Server-side adapter
- `@inertiajs/react` - Client-side React adapter
- `antd` - UI components
- `@ant-design/icons` - Icon library

## Project Structure

```
├── app/
│   ├── Http/
│   │   ├── Controllers/      # All controllers
│   │   ├── Middleware/       # Custom middleware
│   │   └── Requests/         # Form request validation
│   ├── Models/               # Eloquent models
│   ├── Notifications/        # Email notifications
│   └── Policies/             # Authorization policies
├── database/
│   ├── data/                 # CSV data for seeding
│   ├── factories/            # Model factories for testing
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── resources/
│   ├── js/
│   │   ├── Components/       # Reusable React components
│   │   ├── Layouts/          # Page layouts
│   │   ├── Pages/            # Inertia page components
│   │   └── types/            # TypeScript type definitions
│   └── views/                # Blade templates (minimal)
├── routes/
│   ├── web.php               # Web routes
│   └── auth.php              # Authentication routes
└── public/
    └── build/                # Compiled frontend assets (committed)
```

## Key Models & Relationships

### User
- Roles: `admin`, `manager`, `developer`
- Can manage projects (as manager)
- Can be assigned to projects (as developer)

### Project
- Has many: credentials, resources, todos
- Belongs to many: tags, developers (users)
- Cascade deletes: When deleted, all credentials, resources, todos are deleted, and tag/developer associations are detached

### Credential
- Types: `wordpress`, `hosting`, `database`, `email`, `ssh`, `ftp`, `api`, `other`
- Passwords are encrypted
- Can have share links for temporary access

### Todo
- Statuses: `pending`, `in_progress`, `completed`
- Can have file attachments
- Can be assigned to a developer

### Resource
- Types: `document`, `image`, `link`, `note`
- Stores files or URLs related to projects

## Database Configuration

### Local Development (SQLite)
```env
DB_CONNECTION=sqlite
# DB_DATABASE is automatically set to database/database.sqlite
```

### Production (MySQL)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u176148229_lsm
DB_USERNAME=u176148229_lsm
DB_PASSWORD=your_password
```

### Seeder Compatibility
The seeders handle both SQLite and MySQL:
```php
$driver = DB::getDriverName();
if ($driver === 'sqlite') {
    DB::statement('PRAGMA foreign_keys = OFF');
} else {
    DB::statement('SET FOREIGN_KEY_CHECKS = 0');
}
```

## Deployment Setup (Hostinger Shared Hosting)

### Server Details
- **Provider**: Hostinger Shared Hosting
- **Domain**: landeseitenmaintenance.site
- **SSH Access**: `u176148229@fr-int-web1703`
- **App Location**: `~/domains/landeseitenmaintenance.site/LandeseitenMaintenance/`

### Directory Structure on Server
```
~/domains/landeseitenmaintenance.site/
├── public_html -> LandeseitenMaintenance/public  (symlink!)
└── LandeseitenMaintenance/
    ├── public/
    │   └── build/           # Pre-built frontend assets
    ├── storage/
    │   └── app/public/      # Uploaded files
    └── ... (rest of Laravel app)
```

### Critical: Symlink Setup
Hostinger serves from `public_html`, but Laravel's entry point is `public/`. The solution:
```bash
cd ~/domains/landeseitenmaintenance.site/
rm -rf public_html
ln -s LandeseitenMaintenance/public public_html
```

### Why Build Files Are Committed
The server has **no Node.js**, so we cannot run `npm run build` there. Frontend assets are:
1. Built locally with `npm run build`
2. Committed to git in `public/build/`
3. Pushed and pulled on the server

### Deployment Workflow
```bash
# Local machine
npm run build
git add -A
git commit -m "Your message"
git push

# On server (SSH)
cd ~/domains/landeseitenmaintenance.site/LandeseitenMaintenance
git pull
php artisan migrate --force  # If there are migrations
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Storage Link
For file uploads to work:
```bash
php artisan storage:link
```
This creates `public/storage -> storage/app/public`

## Development Workflow

### Starting Development Server
```bash
# Terminal 1: Laravel backend
php artisan serve

# Terminal 2: Vite dev server (hot reload)
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
php artisan test
# or
./vendor/bin/pest
```

### Database Commands
```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Run specific seeder
php artisan db:seed --class=ProductionSeeder
```

## Important Routes

| Route | Controller | Description |
|-------|------------|-------------|
| `/` | DashboardController | Dashboard with stats |
| `/projects` | ProjectController | Project CRUD |
| `/projects/{id}` | ProjectController@show | Project details with tabs |
| `/vault` | VaultController | Global credentials view |
| `/users` | UserController | User management (admin) |
| `/activity` | ActivityController | Activity log |

## Authentication & Authorization

### Roles
- **Admin**: Full access to everything
- **Manager**: Can manage assigned projects and their team
- **Developer**: Can access assigned projects only

### Policies
Each model has a policy in `app/Policies/` that controls:
- `viewAny`, `view`, `create`, `update`, `delete`

## Environment Variables

### Required
```env
APP_NAME="LSM"
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://landeseitenmaintenance.site

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=u176148229_lsm
DB_USERNAME=u176148229_lsm
DB_PASSWORD=...

MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=noreply@landeseitenmaintenance.site
```

## Common Tasks

### Adding a New Page
1. Create controller method in `app/Http/Controllers/`
2. Add route in `routes/web.php`
3. Create React component in `resources/js/Pages/`
4. Use `Inertia::render('PageName', $data)` in controller

### Adding a New Model
1. Create migration: `php artisan make:migration create_xxx_table`
2. Create model: `php artisan make:model Xxx`
3. Create factory: `php artisan make:factory XxxFactory`
4. Create policy: `php artisan make:policy XxxPolicy --model=Xxx`
5. Register policy in `AppServiceProvider`

### Modifying Frontend
1. Make changes in `resources/js/`
2. Run `npm run build`
3. Commit build files
4. Push and pull on server

## GitHub Repository

- **URL**: https://github.com/gamatech89/LandeseitenMaintenance
- **Branch**: main

## Troubleshooting

### "Mix manifest not found" or blank page
- Ensure `public/build/manifest.json` exists
- Run `npm run build` locally and commit

### Permissions issues on server
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Database connection refused
- Check `.env` database credentials
- Ensure MySQL service is running
- Verify database exists

### Symlink broken
```bash
cd ~/domains/landeseitenmaintenance.site/
rm public_html
ln -s LandeseitenMaintenance/public public_html
```

## Recent Features

- **Cascading Deletes**: When a project is deleted, all related credentials, resources, todos, and associations are automatically deleted
- **Vault Credential Deletion**: Admins can delete credentials directly from the Vault page
- **Maintenance Init Todos**: Option to automatically create standard maintenance todos when creating a new project
- **Secure Credential Sharing**: Generate temporary, expiring links to share credentials externally
