import * as axios from 'axios';
import { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, LoginRequest, AuthResponse, User, DashboardResponse, DashboardStats, ProjectFilters, PaginatedResponse, Project, CreateProjectRequest, UpdateProjectRequest, ProjectFilterOptions, Credential, CreateCredentialRequest, Todo, CreateTodoRequest, CreateUserRequest, Tag, Notification, SearchResponse, MaintenanceReport } from '@lsm/types';
export * from '@lsm/types';

/**
 * LSM API Client
 *
 * Shared API client for web and mobile applications.
 * Provides type-safe API calls with automatic token handling.
 */

interface ApiClientConfig {
    /**
     * Base URL for the API (e.g., 'http://localhost:8000/api/v1')
     */
    baseURL: string;
    /**
     * Function to retrieve the current auth token
     */
    getToken: () => string | null;
    /**
     * Callback when a 401 Unauthorized response is received
     */
    onUnauthorized?: () => void;
    /**
     * Optional timeout in milliseconds (default: 30000)
     */
    timeout?: number;
}
/**
 * Creates a configured Axios instance for API calls
 */
declare function createApiClient(config: ApiClientConfig): AxiosInstance;
type ApiClient = AxiosInstance;
/**
 * Unwraps the data from an API response
 */
declare function unwrapResponse<T>(response: {
    data: ApiResponse<T>;
}): T;
/**
 * Unwraps paginated response
 */
declare function unwrapPaginatedResponse<T>(response: {
    data: T;
}): T;

declare function createAuthApi(client: AxiosInstance): {
    /**
     * Authenticate user and get token
     */
    login: (credentials: LoginRequest) => Promise<axios.AxiosResponse<ApiResponse<AuthResponse>, any, {}>>;
    /**
     * Revoke current token
     */
    logout: () => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Revoke all tokens (logout from all devices)
     */
    logoutAll: () => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Get currently authenticated user
     */
    getUser: () => Promise<axios.AxiosResponse<ApiResponse<User>, any, {}>>;
    /**
     * Refresh the current token
     */
    refreshToken: () => Promise<axios.AxiosResponse<ApiResponse<{
        token: string;
        token_type: "Bearer";
    }>, any, {}>>;
};
type AuthApi = ReturnType<typeof createAuthApi>;

declare function createDashboardApi(client: AxiosInstance): {
    /**
     * Get full dashboard data (stats + recent issues)
     */
    get: () => Promise<axios.AxiosResponse<ApiResponse<DashboardResponse>, any, {}>>;
    /**
     * Get stats only (lighter endpoint)
     */
    getStats: () => Promise<axios.AxiosResponse<ApiResponse<DashboardStats>, any, {}>>;
};
type DashboardApi = ReturnType<typeof createDashboardApi>;

declare function createProjectsApi(client: AxiosInstance): {
    /**
     * List projects with pagination and filters
     */
    list: (filters?: ProjectFilters) => Promise<axios.AxiosResponse<PaginatedResponse<Project>, any, {}>>;
    /**
     * Get a single project by ID
     */
    get: (id: number) => Promise<axios.AxiosResponse<ApiResponse<Project>, any, {}>>;
    /**
     * Create a new project
     */
    create: (data: CreateProjectRequest) => Promise<axios.AxiosResponse<ApiResponse<Project>, any, {}>>;
    /**
     * Update an existing project
     */
    update: (id: number, data: UpdateProjectRequest) => Promise<axios.AxiosResponse<ApiResponse<Project>, any, {}>>;
    /**
     * Delete a project
     */
    delete: (id: number) => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Trigger a health check for a project
     */
    checkHealth: (id: number) => Promise<axios.AxiosResponse<ApiResponse<{
        health_data: Record<string, unknown>;
        project: Project;
    }>, any, {}>>;
    /**
     * Get filter options (managers, developers, tags)
     */
    getFilterOptions: () => Promise<axios.AxiosResponse<ApiResponse<ProjectFilterOptions>, any, {}>>;
    /**
     * Get project statistics
     */
    getStats: () => Promise<axios.AxiosResponse<ApiResponse<DashboardStats>, any, {}>>;
};
type ProjectsApi = ReturnType<typeof createProjectsApi>;

declare function createCredentialsApi(client: AxiosInstance): {
    /**
     * List credentials for a project
     */
    listByProject: (projectId: number) => Promise<axios.AxiosResponse<ApiResponse<Credential[]>, any, {}>>;
    /**
     * Create a credential for a project
     */
    create: (projectId: number, data: CreateCredentialRequest) => Promise<axios.AxiosResponse<ApiResponse<Credential>, any, {}>>;
    /**
     * Update a credential
     */
    update: (id: number, data: Partial<CreateCredentialRequest>) => Promise<axios.AxiosResponse<ApiResponse<Credential>, any, {}>>;
    /**
     * Delete a credential
     */
    delete: (id: number) => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Reveal credential password (logged for audit)
     */
    reveal: (id: number) => Promise<axios.AxiosResponse<ApiResponse<Credential>, any, {}>>;
};
type CredentialsApi = ReturnType<typeof createCredentialsApi>;

interface TodoFilters {
    status?: string;
    priority?: string;
    assignee_id?: number;
    include_completed?: boolean;
}
declare function createTodosApi(client: AxiosInstance): {
    /**
     * List todos for a project
     */
    listByProject: (projectId: number, filters?: TodoFilters) => Promise<axios.AxiosResponse<ApiResponse<Todo[]>, any, {}>>;
    /**
     * Get a single todo
     */
    get: (id: number) => Promise<axios.AxiosResponse<ApiResponse<Todo>, any, {}>>;
    /**
     * Create a todo for a project
     */
    create: (projectId: number, data: CreateTodoRequest | FormData) => Promise<axios.AxiosResponse<ApiResponse<Todo>, any, {}>>;
    /**
     * Update a todo
     */
    update: (id: number, data: Partial<CreateTodoRequest & {
        completed?: boolean;
    }> | FormData) => Promise<axios.AxiosResponse<ApiResponse<Todo>, any, {}>>;
    /**
     * Delete a todo
     */
    delete: (id: number) => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Download todo attachment
     */
    downloadFile: (id: number) => Promise<axios.AxiosResponse<any, any, {}>>;
};
type TodosApi = ReturnType<typeof createTodosApi>;

interface TeamFilters {
    role?: string;
    search?: string;
}
declare function createTeamApi(client: AxiosInstance): {
    /**
     * List team members
     */
    list: (filters?: TeamFilters) => Promise<axios.AxiosResponse<ApiResponse<User[]>, any, {}>>;
    /**
     * Get a team member
     */
    get: (id: number) => Promise<axios.AxiosResponse<ApiResponse<User>, any, {}>>;
    /**
     * Create a team member (admin only)
     */
    create: (data: CreateUserRequest) => Promise<axios.AxiosResponse<ApiResponse<User>, any, {}>>;
    /**
     * Update a team member (admin only)
     */
    update: (id: number, data: Partial<CreateUserRequest>) => Promise<axios.AxiosResponse<ApiResponse<User>, any, {}>>;
    /**
     * Delete a team member (admin only)
     */
    delete: (id: number) => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Get projects assigned to a team member
     */
    getProjects: (id: number) => Promise<axios.AxiosResponse<ApiResponse<Project[]>, any, {}>>;
};
type TeamApi = ReturnType<typeof createTeamApi>;

interface VaultFilters {
    type?: string;
    search?: string;
    sort_by?: 'updated_at' | 'title' | 'project';
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}
declare function createVaultApi(client: AxiosInstance): {
    /**
     * List all accessible credentials
     */
    list: (filters?: VaultFilters) => Promise<axios.AxiosResponse<PaginatedResponse<Credential>, any, {}>>;
};
type VaultApi = ReturnType<typeof createVaultApi>;

declare function createTagsApi(client: AxiosInstance): {
    /**
     * List all tags
     */
    list: () => Promise<axios.AxiosResponse<ApiResponse<Tag[]>, any, {}>>;
    /**
     * Get a single tag
     */
    get: (id: number) => Promise<axios.AxiosResponse<ApiResponse<Tag>, any, {}>>;
    /**
     * Create a tag
     */
    create: (data: {
        name: string;
        color?: string;
    }) => Promise<axios.AxiosResponse<ApiResponse<Tag>, any, {}>>;
    /**
     * Update a tag
     */
    update: (id: number, data: {
        name?: string;
        color?: string;
    }) => Promise<axios.AxiosResponse<ApiResponse<Tag>, any, {}>>;
    /**
     * Delete a tag
     */
    delete: (id: number) => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
};
type TagsApi = ReturnType<typeof createTagsApi>;

interface NotificationsResponse {
    data: Notification[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    unread_count: number;
}
declare function createNotificationsApi(client: AxiosInstance): {
    /**
     * List notifications
     */
    list: (page?: number, perPage?: number) => Promise<axios.AxiosResponse<ApiResponse<NotificationsResponse>, any, {}>>;
    /**
     * Mark a notification as read
     */
    markAsRead: (id: string) => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead: () => Promise<axios.AxiosResponse<ApiResponse<null>, any, {}>>;
    /**
     * Get unread count
     */
    getUnreadCount: () => Promise<axios.AxiosResponse<ApiResponse<{
        count: number;
    }>, any, {}>>;
};
type NotificationsApi = ReturnType<typeof createNotificationsApi>;

declare function createSearchApi(client: AxiosInstance): {
    /**
     * Global search across projects and credentials
     */
    search: (query: string, limit?: number) => Promise<axios.AxiosResponse<ApiResponse<SearchResponse>, any, {}>>;
};
type SearchApi = ReturnType<typeof createSearchApi>;

/**
 * Activity Log API Module
 */

interface ActivityLog {
    id: number;
    description: string;
    subject_type: string;
    subject_id: number;
    causer_id: number;
    causer?: {
        id: number;
        name: string;
    };
    properties: Record<string, unknown>;
    created_at: string;
}
interface ActivityFilters {
    page?: number;
    per_page?: number;
    search?: string;
    subject_type?: string;
    causer_id?: number;
    date_from?: string;
    date_to?: string;
}
declare function createActivityApi(client: AxiosInstance): {
    list: (filters?: ActivityFilters) => Promise<AxiosResponse<PaginatedResponse<ActivityLog>>>;
};

/**
 * Maintenance Reports API Module
 */

interface CreateMaintenanceReportRequest {
    report_date: string;
    type: 'monthly' | 'weekly' | 'ad-hoc';
    summary: string;
    tasks_completed?: string[];
    updates_performed?: string[];
    issues_found?: string[];
    issues_resolved?: string[];
    notes?: string;
    time_spent_minutes?: number;
}
declare function createMaintenanceReportsApi(client: AxiosInstance): {
    list: (projectId: number) => Promise<AxiosResponse<ApiResponse<MaintenanceReport[]>>>;
    get: (reportId: number) => Promise<AxiosResponse<ApiResponse<MaintenanceReport>>>;
    create: (projectId: number, data: CreateMaintenanceReportRequest) => Promise<AxiosResponse<ApiResponse<MaintenanceReport>>>;
    update: (reportId: number, data: Partial<CreateMaintenanceReportRequest>) => Promise<AxiosResponse<ApiResponse<MaintenanceReport>>>;
    delete: (projectId: number, reportId: number) => Promise<AxiosResponse<void>>;
    getPdfUrl: (reportId: number) => string;
    suggestions: (field: string, search?: string) => Promise<AxiosResponse<ApiResponse<string[]>>>;
};

/**
 * Resources API Client
 * CRUD operations for project resources
 */

interface Resource {
    id: number;
    project_id: number;
    title: string;
    type: 'link' | 'file';
    url?: string;
    file_path?: string;
    notes?: string;
    is_quick_action?: boolean;
    created_at: string;
    updated_at: string;
}
interface CreateResourceRequest {
    title: string;
    type: 'link' | 'file';
    url?: string;
    notes?: string;
    is_quick_action?: boolean;
}
interface UpdateResourceRequest {
    title?: string;
    type?: 'link' | 'file';
    url?: string;
    notes?: string;
    is_quick_action?: boolean;
}
interface ResourcesApi {
    list: (projectId: number) => Promise<AxiosResponse<{
        data: Resource[];
    }>>;
    create: (projectId: number, data: CreateResourceRequest) => Promise<AxiosResponse<{
        data: Resource;
    }>>;
    update: (id: number, data: UpdateResourceRequest) => Promise<AxiosResponse<{
        data: Resource;
    }>>;
    delete: (id: number) => Promise<AxiosResponse<void>>;
    download: (id: number) => Promise<AxiosResponse<Blob>>;
}
declare function createResourcesApi(client: ApiClient): ResourcesApi;

interface TimeEntry {
    id: number;
    user_id: number;
    project_id: number;
    description: string | null;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    formatted_duration: string;
    duration_hours: number;
    is_running: boolean;
    is_billable: boolean;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
    rejection_reason: string | null;
    timesheet_id: number | null;
    user?: {
        id: number;
        name: string;
    };
    project?: {
        id: number;
        name: string;
        url: string;
    };
    todo?: {
        id: number;
        title: string;
        status: string;
    };
    approver?: {
        id: number;
        name: string;
    } | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}
interface Timesheet {
    id: number;
    user_id: number;
    week_number: number;
    year: number;
    week_start: string;
    week_end: string;
    week_label: string;
    status: 'open' | 'submitted' | 'approved' | 'rejected' | 'paid';
    total_minutes: number;
    total_billable_minutes: number;
    formatted_total: string;
    submitted_at: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
    user?: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    } | null;
    entries?: TimeEntry[];
    entries_count?: number;
    created_at: string;
    updated_at: string;
}
interface TimerProject {
    id: number;
    name: string;
    url: string;
}
interface StartTimerRequest {
    project_id: number;
    todo_id?: number;
    description?: string;
    is_billable?: boolean;
}
interface StopTimerRequest {
    description?: string;
}
interface CreateTimeEntryRequest {
    project_id: number;
    todo_id?: number;
    description?: string;
    started_at: string;
    ended_at: string;
    is_billable?: boolean;
}
interface UpdateTimeEntryRequest {
    project_id?: number;
    todo_id?: number;
    description?: string;
    started_at?: string;
    ended_at?: string;
    is_billable?: boolean;
}
interface TimeEntriesFilters {
    project_id?: number;
    todo_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    week?: number;
    year?: number;
    per_page?: number;
    page?: number;
}
declare function createTimerApi(client: AxiosInstance): {
    getCurrent: () => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimeEntry | null;
    }, any, {}>>;
    start: (data: StartTimerRequest) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimeEntry;
        message: string;
    }, any, {}>>;
    stop: (data?: StopTimerRequest) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimeEntry;
        message: string;
    }, any, {}>>;
    discard: () => Promise<axios.AxiosResponse<{
        success: boolean;
        message: string;
    }, any, {}>>;
    getProjects: () => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimerProject[];
    }, any, {}>>;
};
declare function createTimeEntriesApi(client: AxiosInstance): {
    list: (filters?: TimeEntriesFilters) => Promise<axios.AxiosResponse<{
        data: TimeEntry[];
        total: number;
        current_page: number;
    }, any, {}>>;
    get: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimeEntry;
    }, any, {}>>;
    create: (data: CreateTimeEntryRequest) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimeEntry;
        message: string;
    }, any, {}>>;
    update: (id: number, data: UpdateTimeEntryRequest) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: TimeEntry;
        message: string;
    }, any, {}>>;
    delete: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        message: string;
    }, any, {}>>;
    today: () => Promise<axios.AxiosResponse<{
        success: boolean;
        data: {
            entries: TimeEntry[];
            total_minutes: number;
            formatted_total: string;
        };
    }, any, {}>>;
};
declare function createTimesheetsApi(client: AxiosInstance): {
    list: (filters?: {
        status?: string;
        year?: number;
    }) => Promise<axios.AxiosResponse<{
        data: Timesheet[];
        total: number;
    }, any, {}>>;
    getCurrent: () => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet;
    }, any, {}>>;
    get: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet;
    }, any, {}>>;
    getByWeek: (week: number, year: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet;
    }, any, {}>>;
    submit: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet;
        message: string;
    }, any, {}>>;
    pending: () => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet[];
    }, any, {}>>;
    approve: (id: number, options?: {
        entry_ids?: number[];
        rate_overrides?: Record<number, number>;
    }) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet;
        message: string;
    }, any, {}>>;
    reject: (id: number, reason: string, entryIds?: number[]) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Timesheet;
        message: string;
    }, any, {}>>;
};
interface Invoice {
    id: number;
    user_id: number;
    timesheet_id: number | null;
    invoice_number: string;
    period_start: string;
    period_end: string;
    total_hours: number;
    total_amount: number;
    status: 'draft' | 'pending' | 'approved' | 'declined' | 'paid';
    notes: string | null;
    approved_by: number | null;
    approved_at: string | null;
    paid_at: string | null;
    user?: {
        id: number;
        name: string;
        hourly_rate?: number;
    };
    timesheet?: Timesheet;
    approver?: {
        id: number;
        name: string;
    } | null;
    entries?: TimeEntry[];
    formatted_total?: string;
    formatted_hours?: string;
    created_at: string;
    updated_at: string;
}
declare function createInvoicesApi(client: AxiosInstance): {
    list: (filters?: {
        status?: string;
        user_id?: number;
    }) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: {
            data: Invoice[];
            meta: {
                total: number;
            };
        };
    }, any, {}>>;
    get: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Invoice;
    }, any, {}>>;
    pending: () => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Invoice[];
    }, any, {}>>;
    createFromTimesheet: (timesheetId: number, notes?: string) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Invoice;
        message: string;
    }, any, {}>>;
    approve: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Invoice;
        message: string;
    }, any, {}>>;
    decline: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Invoice;
        message: string;
    }, any, {}>>;
    markAsPaid: (id: number) => Promise<axios.AxiosResponse<{
        success: boolean;
        data: Invoice;
        message: string;
    }, any, {}>>;
};

interface AvailabilityLog {
    id: number;
    user_id: number;
    user?: User;
    status: string;
    start_date: string;
    end_date?: string;
    note?: string;
    created_at: string;
    updated_at: string;
}
interface CreateAvailabilityRequest {
    status: string;
    start_date: string;
    end_date?: string;
    note?: string;
}
declare function createAvailabilityApi(client: AxiosInstance): {
    list: () => Promise<axios.AxiosResponse<ApiResponse<AvailabilityLog[]>, any, {}>>;
    create: (data: CreateAvailabilityRequest) => Promise<axios.AxiosResponse<ApiResponse<AvailabilityLog>, any, {}>>;
};

export { type ActivityFilters, type ActivityLog, type ApiClient, type ApiClientConfig, type AuthApi, type AvailabilityLog, type CreateAvailabilityRequest, type CreateMaintenanceReportRequest, type CreateResourceRequest, type CreateTimeEntryRequest, type CredentialsApi, type DashboardApi, type Invoice, type NotificationsApi, type NotificationsResponse, type ProjectsApi, type Resource, type ResourcesApi, type SearchApi, type StartTimerRequest, type StopTimerRequest, type TagsApi, type TeamApi, type TeamFilters, type TimeEntriesFilters, type TimeEntry, type TimerProject, type Timesheet, type TodoFilters, type TodosApi, type UpdateResourceRequest, type UpdateTimeEntryRequest, type VaultApi, type VaultFilters, createActivityApi, createApiClient, createAuthApi, createAvailabilityApi, createCredentialsApi, createDashboardApi, createInvoicesApi, createMaintenanceReportsApi, createNotificationsApi, createProjectsApi, createResourcesApi, createSearchApi, createTagsApi, createTeamApi, createTimeEntriesApi, createTimerApi, createTimesheetsApi, createTodosApi, createVaultApi, unwrapPaginatedResponse, unwrapResponse };
