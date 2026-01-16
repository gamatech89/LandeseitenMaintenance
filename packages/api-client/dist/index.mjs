// src/client.ts
import axios from "axios";
function createApiClient(config) {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 3e4,
    headers: {
      Accept: "application/json"
    }
  });
  client.interceptors.request.use(
    (requestConfig) => {
      const token = config.getToken();
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    },
    (error) => Promise.reject(error)
  );
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        config.onUnauthorized?.();
      }
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      return Promise.reject(error);
    }
  );
  return client;
}
function unwrapResponse(response) {
  if (!response.data.success) {
    throw new Error(response.data.message ?? "API request failed");
  }
  return response.data.data;
}
function unwrapPaginatedResponse(response) {
  return response.data;
}

// src/auth.ts
function createAuthApi(client) {
  return {
    /**
     * Authenticate user and get token
     */
    login: (credentials) => client.post("/login", credentials),
    /**
     * Revoke current token
     */
    logout: () => client.post("/logout"),
    /**
     * Revoke all tokens (logout from all devices)
     */
    logoutAll: () => client.post("/logout-all"),
    /**
     * Get currently authenticated user
     */
    getUser: () => client.get("/user"),
    /**
     * Refresh the current token
     */
    refreshToken: () => client.post("/refresh-token")
  };
}

// src/dashboard.ts
function createDashboardApi(client) {
  return {
    /**
     * Get full dashboard data (stats + recent issues)
     */
    get: () => client.get("/dashboard"),
    /**
     * Get stats only (lighter endpoint)
     */
    getStats: () => client.get("/dashboard/stats")
  };
}

// src/projects.ts
function createProjectsApi(client) {
  return {
    /**
     * List projects with pagination and filters
     */
    list: (filters) => client.get("/projects", { params: filters }),
    /**
     * Get a single project by ID
     */
    get: (id) => client.get(`/projects/${id}`),
    /**
     * Create a new project
     */
    create: (data) => client.post("/projects", data),
    /**
     * Update an existing project
     */
    update: (id, data) => client.put(`/projects/${id}`, data),
    /**
     * Delete a project
     */
    delete: (id) => client.delete(`/projects/${id}`),
    /**
     * Trigger a health check for a project
     */
    checkHealth: (id) => client.post(
      `/projects/${id}/check-health`
    ),
    /**
     * Get filter options (managers, developers, tags)
     */
    getFilterOptions: () => client.get("/projects-filter-options"),
    /**
     * Get project statistics
     */
    getStats: () => client.get("/projects-stats")
  };
}

// src/credentials.ts
function createCredentialsApi(client) {
  return {
    /**
     * List credentials for a project
     */
    listByProject: (projectId) => client.get(`/projects/${projectId}/credentials`),
    /**
     * Create a credential for a project
     */
    create: (projectId, data) => client.post(`/projects/${projectId}/credentials`, data),
    /**
     * Update a credential
     */
    update: (id, data) => client.put(`/credentials/${id}`, data),
    /**
     * Delete a credential
     */
    delete: (id) => client.delete(`/credentials/${id}`),
    /**
     * Reveal credential password (logged for audit)
     */
    reveal: (id) => client.post(`/credentials/${id}/reveal`)
  };
}

// src/todos.ts
function createTodosApi(client) {
  return {
    /**
     * List todos for a project
     */
    listByProject: (projectId, filters) => client.get(`/projects/${projectId}/todos`, { params: filters }),
    /**
     * Get a single todo
     */
    get: (id) => client.get(`/todos/${id}`),
    /**
     * Create a todo for a project
     */
    create: (projectId, data) => client.post(`/projects/${projectId}/todos`, data),
    /**
     * Update a todo
     */
    update: (id, data) => {
      if (data instanceof FormData) {
        data.append("_method", "PUT");
        return client.post(`/todos/${id}`, data);
      }
      return client.put(`/todos/${id}`, data);
    },
    /**
     * Delete a todo
     */
    delete: (id) => client.delete(`/todos/${id}`),
    /**
     * Download todo attachment
     */
    downloadFile: (id) => client.get(`/todos/${id}/download`, { responseType: "blob" })
  };
}

// src/team.ts
function createTeamApi(client) {
  return {
    /**
     * List team members
     */
    list: (filters) => client.get("/team", { params: filters }),
    /**
     * Get a team member
     */
    get: (id) => client.get(`/team/${id}`),
    /**
     * Create a team member (admin only)
     */
    create: (data) => client.post("/team", data),
    /**
     * Update a team member (admin only)
     */
    update: (id, data) => client.put(`/team/${id}`, data),
    /**
     * Delete a team member (admin only)
     */
    delete: (id) => client.delete(`/team/${id}`),
    /**
     * Get projects assigned to a team member
     */
    getProjects: (id) => client.get(`/team/${id}/projects`)
  };
}

// src/vault.ts
function createVaultApi(client) {
  return {
    /**
     * List all accessible credentials
     */
    list: (filters) => client.get("/vault", { params: filters })
  };
}

// src/tags.ts
function createTagsApi(client) {
  return {
    /**
     * List all tags
     */
    list: () => client.get("/tags"),
    /**
     * Get a single tag
     */
    get: (id) => client.get(`/tags/${id}`),
    /**
     * Create a tag
     */
    create: (data) => client.post("/tags", data),
    /**
     * Update a tag
     */
    update: (id, data) => client.put(`/tags/${id}`, data),
    /**
     * Delete a tag
     */
    delete: (id) => client.delete(`/tags/${id}`)
  };
}

// src/notifications.ts
function createNotificationsApi(client) {
  return {
    /**
     * List notifications
     */
    list: (page, perPage) => client.get("/notifications", {
      params: { page, per_page: perPage }
    }),
    /**
     * Mark a notification as read
     */
    markAsRead: (id) => client.post(`/notifications/${id}/read`),
    /**
     * Mark all notifications as read
     */
    markAllAsRead: () => client.post("/notifications/read-all"),
    /**
     * Get unread count
     */
    getUnreadCount: () => client.get("/notifications/unread-count")
  };
}

// src/search.ts
function createSearchApi(client) {
  return {
    /**
     * Global search across projects and credentials
     */
    search: (query, limit) => client.get("/search", {
      params: { q: query, limit }
    })
  };
}

// src/activity.ts
function createActivityApi(client) {
  return {
    list: (filters) => client.get("/activity", { params: filters })
  };
}

// src/maintenanceReports.ts
function createMaintenanceReportsApi(client) {
  return {
    // List uses nested route
    list: (projectId) => client.get(`/projects/${projectId}/maintenance-reports`),
    // Get uses shallow route (no project prefix)
    get: (reportId) => client.get(`/maintenance-reports/${reportId}`),
    // Create uses nested route
    create: (projectId, data) => client.post(`/projects/${projectId}/maintenance-reports`, data),
    // Update uses shallow route (no project prefix)
    update: (reportId, data) => client.put(`/maintenance-reports/${reportId}`, data),
    // Delete uses shallow route (no project prefix)
    delete: (projectId, reportId) => client.delete(`/maintenance-reports/${reportId}`),
    // PDF download URL - returns the full URL for downloading
    getPdfUrl: (reportId) => `${client.defaults.baseURL}/maintenance-reports/${reportId}/pdf`,
    suggestions: (field, search) => client.get("/maintenance-reports/suggestions", { params: { field, q: search } })
  };
}

// src/resources.ts
function createResourcesApi(client) {
  return {
    list: (projectId) => client.get(`/projects/${projectId}/resources`),
    create: (projectId, data) => client.post(`/projects/${projectId}/resources`, data),
    update: (id, data) => {
      if (data instanceof FormData) {
        data.append("_method", "PUT");
        return client.post(`/resources/${id}`, data);
      }
      return client.put(`/resources/${id}`, data);
    },
    delete: (id) => client.delete(`/resources/${id}`),
    download: (id) => client.get(`/resources/${id}/download`, { responseType: "blob" })
  };
}

// src/timer.ts
function createTimerApi(client) {
  return {
    // Timer operations
    getCurrent: () => client.get("/timer/current"),
    start: (data) => client.post("/timer/start", data),
    stop: (data) => client.post("/timer/stop", data),
    discard: () => client.post("/timer/discard"),
    getProjects: () => client.get("/timer/projects")
  };
}
function createTimeEntriesApi(client) {
  return {
    list: (filters) => client.get("/time-entries", { params: filters }),
    get: (id) => client.get(`/time-entries/${id}`),
    create: (data) => client.post("/time-entries", data),
    update: (id, data) => client.put(`/time-entries/${id}`, data),
    delete: (id) => client.delete(`/time-entries/${id}`),
    today: () => client.get("/time-entries-today")
  };
}
function createTimesheetsApi(client) {
  return {
    list: (filters) => client.get("/timesheets", { params: filters }),
    getCurrent: () => client.get("/timesheets/current"),
    get: (id) => client.get(`/timesheets/${id}`),
    getByWeek: (week, year) => client.get("/timesheets/by-week", { params: { week, year } }),
    submit: (id) => client.post(`/timesheets/${id}/submit`),
    pending: () => client.get("/timesheets/pending"),
    approve: (id, options) => client.post(`/timesheets/${id}/approve`, options),
    reject: (id, reason, entryIds) => client.post(`/timesheets/${id}/reject`, { reason, entry_ids: entryIds })
  };
}
function createInvoicesApi(client) {
  return {
    list: (filters) => client.get("/invoices", { params: filters }),
    get: (id) => client.get(`/invoices/${id}`),
    pending: () => client.get("/invoices/pending"),
    createFromTimesheet: (timesheetId, notes) => client.post("/invoices/from-timesheet", { timesheet_id: timesheetId, notes }),
    approve: (id) => client.post(`/invoices/${id}/approve`),
    decline: (id) => client.post(`/invoices/${id}/decline`),
    markAsPaid: (id) => client.post(`/invoices/${id}/mark-paid`)
  };
}

// src/availability.ts
function createAvailabilityApi(client) {
  return {
    list: () => client.get("/availability"),
    create: (data) => client.post("/availability", data)
  };
}

// src/index.ts
export * from "@lsm/types";
export {
  createActivityApi,
  createApiClient,
  createAuthApi,
  createAvailabilityApi,
  createCredentialsApi,
  createDashboardApi,
  createInvoicesApi,
  createMaintenanceReportsApi,
  createNotificationsApi,
  createProjectsApi,
  createResourcesApi,
  createSearchApi,
  createTagsApi,
  createTeamApi,
  createTimeEntriesApi,
  createTimerApi,
  createTimesheetsApi,
  createTodosApi,
  createVaultApi,
  unwrapPaginatedResponse,
  unwrapResponse
};
