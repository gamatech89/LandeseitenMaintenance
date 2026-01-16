// src/formatters.ts
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatRelativeTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 6e4);
  const diffHours = Math.floor(diffMs / 36e5);
  const diffDays = Math.floor(diffMs / 864e5);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return formatDate(dateString);
}
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function formatDuration(minutes) {
  if (!minutes || minutes === 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
function formatResponseTime(ms) {
  if (!ms) return "-";
  if (ms < 1e3) return `${ms}ms`;
  return `${(ms / 1e3).toFixed(2)}s`;
}
function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
function extractDomain(url) {
  if (!url) return "-";
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

// src/statusHelpers.ts
var healthStatusConfig = {
  online: {
    label: "Online",
    color: "#52c41a",
    bgColor: "#f6ffed",
    icon: "CheckCircle"
  },
  down_error: {
    label: "Down",
    color: "#ff4d4f",
    bgColor: "#fff2f0",
    icon: "CloseCircle"
  },
  updating: {
    label: "Updating",
    color: "#faad14",
    bgColor: "#fffbe6",
    icon: "SyncOutlined"
  }
};
function getHealthStatusConfig(status) {
  return healthStatusConfig[status] ?? healthStatusConfig.online;
}
var securityStatusConfig = {
  secure: {
    label: "Secure",
    color: "#52c41a",
    bgColor: "#f6ffed",
    icon: "SafetyOutlined"
  },
  monitoring: {
    label: "Monitoring",
    color: "#1890ff",
    bgColor: "#e6f7ff",
    icon: "EyeOutlined"
  },
  compromised: {
    label: "At Risk",
    color: "#faad14",
    bgColor: "#fffbe6",
    icon: "WarningOutlined"
  },
  hacked: {
    label: "Hacked",
    color: "#ff4d4f",
    bgColor: "#fff2f0",
    icon: "BugOutlined"
  }
};
function getSecurityStatusConfig(status) {
  return securityStatusConfig[status] ?? securityStatusConfig.secure;
}
var priorityConfig = {
  low: {
    label: "Low",
    color: "#8c8c8c",
    bgColor: "#fafafa",
    icon: "MinusOutlined"
  },
  medium: {
    label: "Medium",
    color: "#1890ff",
    bgColor: "#e6f7ff",
    icon: "ArrowRightOutlined"
  },
  high: {
    label: "High",
    color: "#faad14",
    bgColor: "#fffbe6",
    icon: "ArrowUpOutlined"
  },
  urgent: {
    label: "Urgent",
    color: "#ff4d4f",
    bgColor: "#fff2f0",
    icon: "ExclamationOutlined"
  },
  critical: {
    label: "Critical",
    color: "#cf1322",
    bgColor: "#ffccc7",
    icon: "FireOutlined"
  }
};
function getPriorityConfig(priority) {
  return priorityConfig[priority] ?? priorityConfig.medium;
}
var roleConfig = {
  admin: {
    label: "Admin",
    color: "#722ed1",
    bgColor: "#f9f0ff",
    icon: "CrownOutlined"
  },
  manager: {
    label: "Manager",
    color: "#1890ff",
    bgColor: "#e6f7ff",
    icon: "TeamOutlined"
  },
  developer: {
    label: "Developer",
    color: "#52c41a",
    bgColor: "#f6ffed",
    icon: "CodeOutlined"
  },
  viewer: {
    label: "Viewer",
    color: "#8c8c8c",
    bgColor: "#fafafa",
    icon: "EyeOutlined"
  }
};
function getRoleConfig(role) {
  return roleConfig[role] ?? roleConfig.viewer;
}
function canManageProjects(role) {
  return ["admin", "manager"].includes(role);
}
function canManageTeam(role) {
  return role === "admin";
}
function canViewActivity(role) {
  return role === "admin";
}
function canAssignDevelopers(role) {
  return ["admin", "manager"].includes(role);
}

// src/validators.ts
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
function checkPasswordStrength(password) {
  const suggestions = [];
  let score = 0;
  if (password.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else suggestions.push("Include both uppercase and lowercase letters");
  if (/\d/.test(password)) score++;
  else suggestions.push("Include at least one number");
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else suggestions.push("Include at least one special character");
  const labels = ["weak", "weak", "fair", "good", "strong"];
  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    suggestions
  };
}
function isEmpty(value) {
  return !value || value.trim().length === 0;
}
function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter((field) => {
    const value = data[field];
    if (value === null || value === void 0) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
  });
  return {
    valid: missing.length === 0,
    missing
  };
}

// src/features.ts
var features = {
  // Phase 1 - Enabled
  maintenance: true,
  projects: true,
  credentials: true,
  vault: true,
  todos: true,
  maintenanceReports: true,
  healthMonitoring: true,
  // Phase 2 - Disabled (future)
  deployment: false,
  cicd: false,
  serverManagement: false,
  // Phase 3 - Disabled (future)
  design: false,
  figmaIntegration: false,
  componentLibrary: false,
  // Extras - Disabled
  analytics: false,
  publicApi: false
};
function isFeatureEnabled(feature) {
  return features[feature] ?? false;
}
function getEnabledFeatures() {
  return Object.keys(features).filter(
    (key) => features[key]
  );
}
export {
  canAssignDevelopers,
  canManageProjects,
  canManageTeam,
  canViewActivity,
  checkPasswordStrength,
  extractDomain,
  features,
  formatDate,
  formatDateTime,
  formatDuration,
  formatFileSize,
  formatRelativeTime,
  formatResponseTime,
  getEnabledFeatures,
  getHealthStatusConfig,
  getPriorityConfig,
  getRoleConfig,
  getSecurityStatusConfig,
  healthStatusConfig,
  isEmpty,
  isFeatureEnabled,
  isValidEmail,
  isValidHexColor,
  isValidUrl,
  priorityConfig,
  roleConfig,
  securityStatusConfig,
  truncate,
  validateRequired
};
