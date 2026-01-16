<?php
/**
 * Logger class for Landeseiten Maintenance.
 *
 * @package Landeseiten_Maintenance
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * LSM Logger class.
 */
class LSM_Logger {

    /**
     * Maximum log entries to keep.
     */
    const MAX_ENTRIES = 100;

    /**
     * Log an event.
     *
     * @param string $action Event action.
     * @param string $status Event status (success, failure, warning).
     * @param array  $context Additional context.
     */
    public static function log($action, $status = 'info', $context = []) {
        $logs = get_option('lsm_activity_log', []);

        $entry = [
            'action'    => $action,
            'status'    => $status,
            'context'   => $context,
            'timestamp' => current_time('mysql'),
            'user_ip'   => self::get_client_ip(),
        ];

        array_unshift($logs, $entry);

        // Keep only last N entries
        $logs = array_slice($logs, 0, self::MAX_ENTRIES);

        update_option('lsm_activity_log', $logs);
    }

    /**
     * Get activity log.
     *
     * @param int $limit Number of entries to return.
     * @return array
     */
    public static function get_log($limit = 50) {
        $logs = get_option('lsm_activity_log', []);
        return array_slice($logs, 0, $limit);
    }

    /**
     * Clear activity log.
     */
    public static function clear_log() {
        update_option('lsm_activity_log', []);
    }

    /**
     * Get client IP address.
     *
     * @return string
     */
    private static function get_client_ip() {
        $ip_keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                return sanitize_text_field($ip);
            }
        }
        
        return 'unknown';
    }
}
