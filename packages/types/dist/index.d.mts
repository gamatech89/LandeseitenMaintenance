/**
 * LSM Platform - Shared Type Definitions
 *
 * This package contains all TypeScript types shared between
 * the web SPA, mobile app, and any future clients.
 */
type HealthStatus = 'online' | 'down_error' | 'updating';
type SecurityStatus = 'secure' | 'monitoring' | 'compromised' | 'hacked';
type UserRole = 'admin' | 'manager' | 'developer' | 'viewer';
type CredentialType = 'wordpress' | 'ssh' | 'ftp' | 'database' | 'hosting' | 'email' | 'api' | 'other';
type TodoPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type MaintenanceReportType = 'monthly' | 'weekly' | 'ad-hoc';
interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}
interface Project {
    id: number;
    name: string;
    url: string;
    domain: string | null;
    client_email: string | null;
    notes: string | null;
    health_status: HealthStatus;
    security_status: SecurityStatus;
    project_external_id: string | null;
    maintenance_id: string | null;
    hosting_provider: string | null;
    hosting_url: string | null;
    ssh_access: string | null;
    drive_link: string | null;
    trello_link: string | null;
    response_time_ms: number | null;
    last_health_check_at: string | null;
    ssl_status: string | null;
    ssl_expires_at: string | null;
    wp_version: string | null;
    php_version: string | null;
    outdated_plugins_count: number | null;
    last_health_details: Record<string, unknown> | null;
    health_check_secret: string | null;
    manager_id: number | null;
    developer_id: number | null;
    manager?: User;
    developer?: User;
    developers?: User[];
    credentials?: Credential[];
    todos?: Todo[];
    resources?: Resource[];
    maintenance_reports?: MaintenanceReport[];
    tags?: Tag[];
    credentials_count?: number;
    todos_count?: number;
    resources_count?: number;
    maintenance_reports_count?: number;
    highest_todo_priority?: TodoPriority;
    created_at: string;
    updated_at: string;
}
interface Credential {
    id: number;
    project_id: number;
    title: string;
    type: CredentialType;
    username: string | null;
    url: string | null;
    note: string | null;
    metadata: Record<string, unknown> | null;
    has_password: boolean;
    password?: string;
    project?: Project;
    created_at: string;
    updated_at: string;
}
interface Todo {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    priority: TodoPriority;
    status: TodoStatus;
    completed: boolean;
    due_date: string | null;
    assignee_id: number | null;
    assignee?: User;
    file_path: string | null;
    file_name: string | null;
    has_attachment: boolean;
    estimated_minutes: number | null;
    time_entries?: TimeEntry[];
    project?: Project;
    created_at: string;
    updated_at: string;
}
interface Resource {
    id: number;
    project_id: number;
    title: string;
    type: 'link' | 'file';
    url: string | null;
    file_path: string | null;
    file_name: string | null;
    file_size: number | null;
    notes: string | null;
    is_quick_action: boolean;
    download_url?: string;
    created_at: string;
    updated_at: string;
}
interface Tag {
    id: number;
    name: string;
    slug: string;
    color: string | null;
    projects_count?: number;
    created_at: string;
    updated_at: string;
}
interface MaintenanceReport {
    id: number;
    project_id: number;
    user_id: number;
    report_date: string;
    type: MaintenanceReportType;
    summary: string;
    tasks_completed: string[];
    updates_performed: string[];
    issues_found: string[];
    issues_resolved: string[];
    notes: string | null;
    time_spent_minutes: number | null;
    time_spent_formatted?: string;
    invoice_id: number | null;
    user?: User;
    project?: Project;
    pdf_url?: string;
    created_at: string;
    updated_at: string;
}
interface UpdatePerformed {
    name: string;
    from_version?: string;
    to_version?: string;
}
interface Notification {
    id: string;
    type: string;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
}
interface ActivityLog {
    id: number;
    description: string;
    subject_type: string;
    subject_id: number | null;
    causer: User | null;
    properties: Record<string, unknown>;
    created_at: string;
}
interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
}
interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
interface AuthResponse {
    user: User;
    token: string;
    token_type: 'Bearer';
}
interface DashboardStats {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    secure: number;
    monitoring: number;
    at_risk: number;
    hacked: number;
}
interface DashboardResponse {
    stats: DashboardStats;
    recent_issues: Project[];
}
interface ProjectFilterOptions {
    managers: User[];
    developers: User[];
    tags: Tag[];
    health_statuses: HealthStatus[];
    security_statuses: SecurityStatus[];
}
interface SearchResponse {
    projects: Project[];
    credentials: Credential[];
    counts: {
        projects: number;
        credentials: number;
    };
}
interface LoginRequest {
    email: string;
    password: string;
    device_name?: string;
}
interface ProjectFilters {
    page?: number;
    per_page?: number;
    search?: string;
    health?: HealthStatus | 'all';
    security?: SecurityStatus | 'all';
    manager_id?: number;
    developer_id?: number;
    tag?: string;
}
interface CreateProjectRequest {
    name: string;
    url: string;
    client_email?: string;
    notes?: string;
    health_status?: HealthStatus;
    security_status?: SecurityStatus;
    manager_id?: number;
    developer_ids?: number[];
    tag_ids?: number[];
    project_external_id?: string;
    maintenance_id?: string;
    add_maintenance_todos?: boolean;
}
interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
    health_check_secret?: string;
}
interface CreateCredentialRequest {
    title: string;
    type: CredentialType;
    username?: string;
    password?: string;
    url?: string;
    note?: string;
    metadata?: Record<string, unknown>;
}
interface CreateTodoRequest {
    title: string;
    description?: string;
    priority: TodoPriority;
    estimated_minutes?: number;
    status?: TodoStatus;
    due_date?: string;
    assignee_id?: number;
}
interface CreateMaintenanceReportRequest {
    report_date: string;
    type: MaintenanceReportType;
    summary: string;
    tasks_completed?: string[];
    updates_performed?: UpdatePerformed[];
    issues_found?: string[];
    issues_resolved?: string[];
    notes?: string;
    time_spent_minutes?: number;
    invoice_id?: number;
}
interface TimeEntry {
    id: number;
    user_id: number;
    project_id: number;
    todo_id: number | null;
    description: string | null;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    is_billable: boolean;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
    timesheet_id: number | null;
    formatted_duration?: string;
    user?: User;
    project?: Project;
    todo?: Todo;
}
interface CreateTimeEntryRequest {
    project_id: number;
    todo_id?: number;
    description?: string;
    started_at: string;
    ended_at: string;
    is_billable?: boolean;
}
interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export type { ActivityLog, ApiResponse, AuthResponse, CreateCredentialRequest, CreateMaintenanceReportRequest, CreateProjectRequest, CreateTimeEntryRequest, CreateTodoRequest, CreateUserRequest, Credential, CredentialType, DashboardResponse, DashboardStats, HealthStatus, LoginRequest, MaintenanceReport, MaintenanceReportType, Notification, PaginatedResponse, Project, ProjectFilterOptions, ProjectFilters, Resource, SearchResponse, SecurityStatus, Tag, TimeEntry, Todo, TodoPriority, TodoStatus, UpdatePerformed, UpdateProjectRequest, User, UserRole };
