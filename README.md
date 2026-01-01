# LSM - Landeseiten Maintenance

A modern, high-performance maintenance management system for 100+ WordPress sites built with Laravel 12, Inertia.js, React, TypeScript, and Ant Design.

## Features

-   **Dashboard**: High-level "Traffic Light" stats showing critical issues at a glance
-   **Projects Management**: Dense, paginated table with filtering by Health and Security status
-   **Vault**: Encrypted credential storage with copy-to-clipboard and reveal/hide functionality
-   **Team Management**: User roles (Admin, Manager, Viewer) with appropriate permissions
-   **Dark/Light Theme**: Professional dark sidebar with theme switcher
-   **Modern UI**: Ant Design v5 with compact mode for maximum information density

## Tech Stack

-   **Backend**: Laravel 12 (Latest)
-   **Frontend**: React 18 + TypeScript + Inertia.js
-   **UI Library**: Ant Design v5
-   **Database**: SQLite (easily switchable to MySQL/PostgreSQL)
-   **Styling**: Tailwind CSS + Ant Design Theme Config
-   **Security**: Laravel Crypt facade for credential encryption

## Project Status

### Health Status

-   `online` - Site is up and running
-   `down_error` - Site is down or experiencing errors
-   `updating` - Maintenance mode / updates in progress

### Security Status

-   `secure` - No issues detected
-   `monitoring` - Under routine security monitoring
-   `compromised` - Potential security breach detected
-   `hacked` - Confirmed security breach

## Installation

### Prerequisites

-   PHP 8.2+
-   Node.js 20.19+ or 22.12+
-   Composer
-   npm or yarn

### Setup Steps

1. **Install PHP dependencies**:

    ```bash
    composer install
    ```

2. **Install Node dependencies**:

    ```bash
    npm install
    ```

3. **Environment Configuration**:
   The `.env` file is already configured for SQLite. The database file is at `database/database.sqlite`.

4. **Run Database Migrations** (if needed):

    ```bash
    php artisan migrate:fresh --seed
    ```

    This will create:

    - 3 test users (see credentials below)
    - 20 realistic dummy projects
    - Credentials for each project
    - Resource links for each project

5. **Build Frontend Assets**:

    ```bash
    npm run build
    ```

    Or for development with hot reload:

    ```bash
    npm run dev
    ```

6. **Start the Development Server**:

    ```bash
    php artisan serve
    ```

7. **Access the Application**:
   Open your browser and navigate to: `http://localhost:8000`

## Default Users

The database seeder creates three test users:

| Email               | Password | Role    |
| ------------------- | -------- | ------- |
| admin@example.com   | password | Admin   |
| manager@example.com | password | Manager |
| viewer@example.com  | password | Viewer  |

## User Roles & Permissions

-   **Admin**: Full access - can manage team, view/edit all projects, manage credentials
-   **Manager**: Can view and edit projects and credentials
-   **Viewer**: Read-only access to projects and credentials

## Development

### Running in Development Mode

To run both the PHP server and the Vite dev server simultaneously:

**Terminal 1** - Start PHP server:

```bash
php artisan serve
```

**Terminal 2** - Start Vite dev server:

```bash
npm run dev
```

Then access the app at `http://localhost:8000`

### Building for Production

```bash
npm run build
```

## Project Structure

```
app/
├── Http/Controllers/
│   ├── DashboardController.php    # Dashboard with stats
│   └── ProjectController.php      # Projects CRUD
├── Models/
│   ├── User.php                   # User with roles
│   ├── Project.php                # Projects
│   ├── Credential.php             # Encrypted credentials
│   └── Resource.php               # Files and links
database/
├── migrations/                    # Database schema
└── seeders/
    └── DatabaseSeeder.php         # 20 dummy projects
resources/
├── js/
│   ├── Contexts/
│   │   └── ThemeContext.tsx      # Dark/Light theme
│   ├── Layouts/
│   │   └── AuthenticatedLayout.tsx  # Main app layout
│   └── Pages/
│       ├── Dashboard.tsx          # Traffic light stats
│       └── Projects/
│           ├── Index.tsx          # Projects table with filters
│           └── Show.tsx           # Project details with tabs
└── css/
    └── app.css                    # Tailwind + Ant Design styles
```

## Database Schema

### Users Table

-   `id`, `name`, `email`, `password`, `role` (admin/manager/viewer)

### Projects Table

-   `id`, `name`, `url`, `client_email`, `notes` (markdown)
-   `health_status` (online/down_error/updating)
-   `security_status` (secure/monitoring/compromised/hacked)

### Credentials Table

-   `id`, `project_id`, `title`, `type` (ssh/ftp/db/wp_admin/api)
-   `username`, `password` (encrypted), `url`

### Resources Table

-   `id`, `project_id`, `title`, `type` (link/file)
-   `url`, `file_path`

## Security

-   All credentials are encrypted using Laravel's `Crypt` facade
-   Role-based access control (RBAC) for team management
-   CSRF protection on all forms
-   Secure password hashing with bcrypt

## Theme Customization

The application supports dark and light modes:

-   Toggle via the bulb icon in the top right
-   Sidebar stays dark/charcoal for professional look
-   Uses Ant Design's `darkAlgorithm` and `defaultAlgorithm`
-   Theme preference is saved in localStorage

## Screenshots

### Dashboard

-   Traffic light stats for health and security status
-   Critical alerts prominently displayed
-   Recent issues list with quick navigation

### Projects Table

-   Searchable and filterable
-   Color-coded status badges
-   Dense layout for viewing many projects at once

### Project Details

-   Tabbed interface (Overview, Credentials, Resources)
-   Encrypted credential storage with reveal/hide
-   Copy-to-clipboard functionality
-   Markdown support for notes

## License

Proprietary - All rights reserved.
