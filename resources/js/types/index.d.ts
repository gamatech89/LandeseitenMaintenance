// ============================================
// USER & AUTH TYPES
// ============================================
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: "admin" | "manager" | "developer" | "viewer";
}

export interface Flash {
    success?: string;
    error?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
    flash: Flash;
};

// ============================================
// PROJECT TYPES
// ============================================
export type HealthStatus = "online" | "down_error" | "updating";
export type SecurityStatus = "secure" | "monitoring" | "compromised" | "hacked";

export interface Project {
    id: number;
    name: string;
    url: string;
    domain?: string;
    client_email?: string;
    notes?: string;
    health_status: HealthStatus;
    security_status: SecurityStatus;
    project_external_id?: string;
    maintenance_id?: string;
    hosting_provider?: string;
    hosting_url?: string;
    ssh_access?: string;
    drive_link?: string;
    trello_link?: string;
    manager_id: number | null;
    developer_id: number | null;
    manager?: User;
    developer?: User;
    developers: User[];
    credentials: Credential[];
    resources: Resource[];
    todos: Todo[];
    tags: Tag[];
    // Health monitoring fields
    response_time_ms?: number;
    last_health_check_at?: string;
    ssl_status?: "valid" | "expiring_soon" | "expired" | "none";
    ssl_expires_at?: string;
    wp_version?: string;
    php_version?: string;
    outdated_plugins_count?: number;
    created_at: string;
    updated_at: string;
}

// ============================================
// CREDENTIAL TYPES
// ============================================
export type CredentialType =
    | "wordpress"
    | "ssh"
    | "ftp"
    | "database"
    | "hosting"
    | "email"
    | "api"
    | "other";

export interface CredentialMetadata {
    hostname?: string;
    port?: number | string;
    host?: string;
    database_name?: string;
    [key: string]: string | number | undefined;
}

export interface Credential {
    id: number;
    project_id: number;
    title: string;
    type: CredentialType;
    username?: string;
    password?: string;
    url?: string;
    metadata?: CredentialMetadata;
    project?: Project;
    created_at: string;
    updated_at: string;
}

export interface CredentialShareLink {
    id: number;
    share_url: string;
    expires_at: string;
    is_expired: boolean;
    max_views: number;
    view_count: number;
    has_password: boolean;
    recipient_email?: string;
    created_by: string;
    created_at: string;
    access_logs_count: number;
}

// ============================================
// RESOURCE TYPES
// ============================================
export type ResourceType = "link" | "file";

export interface Resource {
    id: number;
    project_id: number;
    title: string;
    type: ResourceType;
    url?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// TODO TYPES
// ============================================
export type TodoPriority = "low" | "medium" | "high" | "critical" | 0 | 1 | 2;
export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Todo {
    id: number;
    project_id: number;
    title: string;
    description?: string;
    priority: TodoPriority;
    status: TodoStatus;
    completed: boolean;
    due_date?: string;
    file_path?: string;
    file_name?: string;
    assignee_id?: number;
    assignee?: User;
    project?: Project;
    created_at: string;
    updated_at: string;
}

// ============================================
// TAG TYPES
// ============================================
export interface Tag {
    id: number;
    name: string;
    slug: string;
    color?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface DashboardStats {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    secure: number;
    monitoring: number;
    at_risk: number;
    hacked: number;
}

// ============================================
// PAGINATION TYPES
// ============================================
export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

// ============================================
// ACTIVITY LOG TYPES
// ============================================
export interface ActivityLog {
    id: number;
    description: string;
    subject_type: string;
    subject_id: number;
    causer_type?: string;
    causer_id?: number;
    properties?: Record<string, unknown>;
    created_at: string;
    causer?: User;
}
