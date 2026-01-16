/**
 * RMB (Remote Management Bridge) API Helper
 * 
 * API client for WordPress site management via the RMB plugin.
 */

import type { AxiosInstance } from 'axios';

export interface RmbStatus {
  configured: boolean;
  connected?: boolean;
  plugin_version?: string;
  message: string;
}

export interface RmbHealth {
  timestamp: string;
  status: string;
  site_url: string;
  wordpress: {
    version: string;
    is_multisite: boolean;
    locale: string;
    timezone: string;
  };
  php: {
    version: string;
  };
  ssl: {
    enabled: boolean;
    expires_at?: string;
  };
  plugins: {
    total: number;
    active: number;
    outdated_count: number;
    outdated?: Array<{ name: string; current: string; new: string }>;
  };
  theme: {
    name: string;
    version: string;
  };
  security: {
    debug_mode: boolean;
    file_editing: boolean;
    wordfence_active: boolean;
  };
}

export interface RmbLoginToken {
  success: boolean;
  token: string;
  login_url: string;
  expires_in: number;
}

export interface RmbUpdates {
  core: { current_version: string; new_version: string } | null;
  plugins: Array<{
    plugin: string;
    slug: string;
    current_version: string;
    new_version: string;
  }>;
  themes: Array<{
    theme: string;
    current_version: string;
    new_version: string;
  }>;
}

export interface RmbCacheResult {
  success: boolean;
  cleared: string[];
  message: string;
}

export interface RmbRecoveryStatus {
  maintenance_mode: boolean;
  disabled_plugins: string[];
  current_theme: string;
  mu_plugin_installed: boolean;
  recovery_token_exists: boolean;
}

export function createRmbApi(client: AxiosInstance) {
  const basePath = (projectId: number) => `/projects/${projectId}/rmb`;

  return {
    /**
     * Get RMB connection status
     */
    getStatus: (projectId: number) =>
      client.get<RmbStatus>(`${basePath(projectId)}/status`),

    /**
     * Get full health data
     */
    getHealth: (projectId: number) =>
      client.get<RmbHealth>(`${basePath(projectId)}/health`),

    /**
     * Generate SSO login token
     */
    generateLoginToken: (projectId: number) =>
      client.post<RmbLoginToken>(`${basePath(projectId)}/login-token`),

    /**
     * Clear all caches
     */
    clearCache: (projectId: number) =>
      client.post<RmbCacheResult>(`${basePath(projectId)}/clear-cache`),

    /**
     * Optimize database
     */
    optimizeDatabase: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/optimize-db`),

    /**
     * Flush rewrite rules
     */
    flushRewrite: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/flush-rewrite`),

    /**
     * Get available updates
     */
    getUpdates: (projectId: number) =>
      client.get<RmbUpdates>(`${basePath(projectId)}/updates`),

    /**
     * Update a specific plugin
     */
    updatePlugin: (projectId: number, slug: string) =>
      client.post<any>(`${basePath(projectId)}/update-plugin`, { slug }),

    /**
     * Update all plugins
     */
    updateAllPlugins: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/update-all-plugins`),

    /**
     * Update WordPress core
     */
    updateCore: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/update-core`),

    /**
     * Get recovery status
     */
    getRecoveryStatus: (projectId: number) =>
      client.get<RmbRecoveryStatus>(`${basePath(projectId)}/recovery-status`),

    /**
     * Enable maintenance mode
     */
    enableMaintenance: (projectId: number, message?: string) =>
      client.post<any>(`${basePath(projectId)}/enable-maintenance`, { message }),

    /**
     * Disable maintenance mode
     */
    disableMaintenance: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/disable-maintenance`),

    /**
     * Disable all plugins (emergency)
     */
    disablePlugins: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/disable-plugins`),

    /**
     * Restore disabled plugins
     */
    restorePlugins: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/restore-plugins`),

    /**
     * Switch to default theme
     */
    switchTheme: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/switch-theme`),

    /**
     * Execute full emergency recovery
     */
    emergencyRecovery: (projectId: number) =>
      client.post<any>(`${basePath(projectId)}/emergency-recovery`),

    /**
     * Download the plugin zip
     */
    downloadPlugin: (projectId: number) =>
      client.get(`${basePath(projectId)}/download-plugin`, { responseType: 'blob' }),
  };
}

export type RmbApi = ReturnType<typeof createRmbApi>;
