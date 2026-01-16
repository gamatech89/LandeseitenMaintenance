import { HealthStatus, SecurityStatus, TodoPriority, UserRole } from '@lsm/types';

/**
 * Formatting Utilities
 */
/**
 * Format a date string to a human-readable format
 */
declare function formatDate(dateString: string | null | undefined): string;
/**
 * Format a date string to include time
 */
declare function formatDateTime(dateString: string | null | undefined): string;
/**
 * Format a relative time (e.g., "2 hours ago")
 */
declare function formatRelativeTime(dateString: string | null | undefined): string;
/**
 * Format bytes to human-readable size
 */
declare function formatFileSize(bytes: number | null | undefined): string;
/**
 * Format minutes to hours and minutes
 */
declare function formatDuration(minutes: number | null | undefined): string;
/**
 * Format response time with appropriate unit
 */
declare function formatResponseTime(ms: number | null | undefined): string;
/**
 * Truncate text with ellipsis
 */
declare function truncate(text: string | null | undefined, maxLength: number): string;
/**
 * Extract domain from URL
 */
declare function extractDomain(url: string | null | undefined): string;

/**
 * Status Helper Utilities
 */

interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}
declare const healthStatusConfig: Record<HealthStatus, StatusConfig>;
declare function getHealthStatusConfig(status: HealthStatus): StatusConfig;
declare const securityStatusConfig: Record<SecurityStatus, StatusConfig>;
declare function getSecurityStatusConfig(status: SecurityStatus): StatusConfig;
declare const priorityConfig: Record<TodoPriority, StatusConfig>;
declare function getPriorityConfig(priority: TodoPriority): StatusConfig;
declare const roleConfig: Record<UserRole, StatusConfig>;
declare function getRoleConfig(role: UserRole): StatusConfig;
declare function canManageProjects(role: UserRole): boolean;
declare function canManageTeam(role: UserRole): boolean;
declare function canViewActivity(role: UserRole): boolean;
declare function canAssignDevelopers(role: UserRole): boolean;

/**
 * Validation Utilities
 */
/**
 * Validate email format
 */
declare function isValidEmail(email: string): boolean;
/**
 * Validate URL format
 */
declare function isValidUrl(url: string): boolean;
/**
 * Validate hex color format
 */
declare function isValidHexColor(color: string): boolean;
/**
 * Validate password strength
 */
interface PasswordStrength {
    score: number;
    label: 'weak' | 'fair' | 'good' | 'strong';
    suggestions: string[];
}
declare function checkPasswordStrength(password: string): PasswordStrength;
/**
 * Check if a string is empty or only whitespace
 */
declare function isEmpty(value: string | null | undefined): boolean;
/**
 * Validate required fields in an object
 */
declare function validateRequired<T extends Record<string, unknown>>(data: T, requiredFields: (keyof T)[]): {
    valid: boolean;
    missing: (keyof T)[];
};

/**
 * Feature Flags
 *
 * Controls which modules are enabled in the application.
 * Future modules can be toggled on/off here.
 */
interface FeatureFlags {
    maintenance: boolean;
    projects: boolean;
    credentials: boolean;
    vault: boolean;
    todos: boolean;
    maintenanceReports: boolean;
    healthMonitoring: boolean;
    deployment: boolean;
    cicd: boolean;
    serverManagement: boolean;
    design: boolean;
    figmaIntegration: boolean;
    componentLibrary: boolean;
    analytics: boolean;
    publicApi: boolean;
}
/**
 * Current feature configuration
 */
declare const features: FeatureFlags;
/**
 * Check if a feature is enabled
 */
declare function isFeatureEnabled(feature: keyof FeatureFlags): boolean;
/**
 * Get all enabled features
 */
declare function getEnabledFeatures(): (keyof FeatureFlags)[];

export { type FeatureFlags, type PasswordStrength, type StatusConfig, canAssignDevelopers, canManageProjects, canManageTeam, canViewActivity, checkPasswordStrength, extractDomain, features, formatDate, formatDateTime, formatDuration, formatFileSize, formatRelativeTime, formatResponseTime, getEnabledFeatures, getHealthStatusConfig, getPriorityConfig, getRoleConfig, getSecurityStatusConfig, healthStatusConfig, isEmpty, isFeatureEnabled, isValidEmail, isValidHexColor, isValidUrl, priorityConfig, roleConfig, securityStatusConfig, truncate, validateRequired };
