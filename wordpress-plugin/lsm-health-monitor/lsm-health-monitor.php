<?php
/**
 * Plugin Name: LSM Health Monitor
 * Plugin URI: https://landeseitenmaintenance.site
 * Description: Secure health monitoring endpoint for Landeseiten Management (LSM) dashboard. Requires a valid license key.
 * Version: 1.0.0
 * Author: Landeseiten.de
 * Author URI: https://landeseiten.de
 * License: GPL v2 or later
 * Text Domain: lsm-health-monitor
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('LSM_HEALTH_VERSION', '1.0.0');
define('LSM_HEALTH_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LSM_HEALTH_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LSM_HEALTH_PLUGIN_BASENAME', plugin_basename(__FILE__));

// LSM Server URL for license validation
define('LSM_SERVER_URL', 'https://landeseitenmaintenance.site');

/**
 * Main Plugin Class
 */
class LSM_Health_Monitor {
    
    /**
     * Option names
     */
    const OPTION_SECRET = 'lsm_health_secret';
    const OPTION_LICENSE = 'lsm_license_key';
    const OPTION_LICENSE_STATUS = 'lsm_license_status';
    const OPTION_LICENSE_DATA = 'lsm_license_data';
    
    /**
     * Singleton instance
     */
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Core hooks
        add_action('init', [$this, 'load_textdomain']);
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        
        // License validation on admin
        add_action('admin_notices', [$this, 'admin_notices']);
        
        // Plugin action links
        add_filter('plugin_action_links_' . LSM_HEALTH_PLUGIN_BASENAME, [$this, 'plugin_action_links']);
        
        // AJAX handlers
        add_action('wp_ajax_lsm_activate_license', [$this, 'ajax_activate_license']);
        add_action('wp_ajax_lsm_deactivate_license', [$this, 'ajax_deactivate_license']);
        add_action('wp_ajax_lsm_regenerate_secret', [$this, 'ajax_regenerate_secret']);
        
        // Cron for license validation
        add_action('lsm_daily_license_check', [$this, 'daily_license_check']);
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Generate secret key if not exists
        if (!get_option(self::OPTION_SECRET)) {
            update_option(self::OPTION_SECRET, $this->generate_secret_key());
        }
        
        // Schedule daily license check
        if (!wp_next_scheduled('lsm_daily_license_check')) {
            wp_schedule_event(time(), 'daily', 'lsm_daily_license_check');
        }
        
        // Flush rewrite rules for REST API
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('lsm_daily_license_check');
        
        // Optionally deactivate license on server
        $this->deactivate_license_on_server();
    }
    
    /**
     * Load plugin text domain
     */
    public function load_textdomain() {
        load_plugin_textdomain('lsm-health-monitor', false, dirname(LSM_HEALTH_PLUGIN_BASENAME) . '/languages');
    }
    
    /**
     * Generate a secure secret key
     */
    private function generate_secret_key() {
        return wp_generate_password(32, false);
    }
    
    /**
     * Check if license is valid
     */
    public function is_license_valid() {
        $status = get_option(self::OPTION_LICENSE_STATUS, 'inactive');
        return $status === 'active';
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Health endpoint (requires valid license)
        register_rest_route('lsm/v1', '/health', [
            'methods' => 'GET',
            'callback' => [$this, 'health_check'],
            'permission_callback' => [$this, 'verify_access'],
        ]);
        
        // Ping endpoint (always available)
        register_rest_route('lsm/v1', '/ping', [
            'methods' => 'GET',
            'callback' => [$this, 'ping'],
            'permission_callback' => '__return_true',
        ]);
        
        // Status endpoint
        register_rest_route('lsm/v1', '/status', [
            'methods' => 'GET',
            'callback' => [$this, 'status_check'],
            'permission_callback' => [$this, 'verify_access'],
        ]);
    }
    
    /**
     * Verify request access (secret key + license)
     */
    public function verify_access($request) {
        // Verify secret key
        $provided_key = $request->get_param('key');
        $stored_key = get_option(self::OPTION_SECRET);
        
        if (empty($stored_key) || empty($provided_key)) {
            return new WP_Error('missing_key', __('Secret key is required', 'lsm-health-monitor'), ['status' => 401]);
        }
        
        if (!hash_equals($stored_key, $provided_key)) {
            return new WP_Error('invalid_key', __('Invalid secret key', 'lsm-health-monitor'), ['status' => 401]);
        }
        
        // Verify license
        if (!$this->is_license_valid()) {
            return new WP_Error('invalid_license', __('Valid license required', 'lsm-health-monitor'), ['status' => 403]);
        }
        
        return true;
    }
    
    /**
     * Ping endpoint - simple availability check
     */
    public function ping() {
        return rest_ensure_response([
            'status' => 'ok',
            'plugin' => 'lsm-health-monitor',
            'version' => LSM_HEALTH_VERSION,
            'licensed' => $this->is_license_valid(),
        ]);
    }
    
    /**
     * Status check endpoint
     */
    public function status_check() {
        return rest_ensure_response([
            'status' => 'ok',
            'timestamp' => current_time('c'),
            'site_url' => get_site_url(),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'plugin_version' => LSM_HEALTH_VERSION,
        ]);
    }
    
    /**
     * Full health check endpoint
     */
    public function health_check($request) {
        global $wpdb;
        
        $health_data = [
            'status' => 'ok',
            'timestamp' => current_time('c'),
            'site_url' => get_site_url(),
            'site_name' => get_bloginfo('name'),
            
            // WordPress Core
            'wordpress' => [
                'version' => get_bloginfo('version'),
                'is_multisite' => is_multisite(),
                'locale' => get_locale(),
                'timezone' => wp_timezone_string(),
            ],
            
            // PHP Info
            'php' => [
                'version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
            ],
            
            // Database
            'database' => [
                'version' => $wpdb->db_version(),
                'prefix' => $wpdb->prefix,
                'charset' => $wpdb->charset,
            ],
            
            // Server
            'server' => [
                'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown',
            ],
            
            // Plugins
            'plugins' => $this->get_plugin_status(),
            
            // Theme
            'theme' => $this->get_theme_status(),
            
            // SSL
            'ssl' => [
                'enabled' => is_ssl(),
                'force_admin' => defined('FORCE_SSL_ADMIN') && FORCE_SSL_ADMIN,
            ],
            
            // Disk Usage
            'disk' => $this->get_disk_usage(),
            
            // Updates Available
            'updates' => $this->get_update_status(),
            
            // Security Checks
            'security' => $this->get_security_status(),
            
            // Performance
            'performance' => $this->get_performance_data(),
            
            // LSM Plugin Info
            'lsm_plugin' => [
                'version' => LSM_HEALTH_VERSION,
                'license_status' => get_option(self::OPTION_LICENSE_STATUS, 'inactive'),
            ],
        ];
        
        // Determine overall status
        $health_data['status'] = $this->calculate_overall_status($health_data);
        
        return rest_ensure_response($health_data);
    }
    
    /**
     * Calculate overall health status
     */
    private function calculate_overall_status($health_data) {
        $issues = 0;
        
        // Check for critical issues
        if ($health_data['updates']['core_update_available']) {
            $issues += 2; // Critical
        }
        
        if ($health_data['plugins']['outdated_count'] > 5) {
            $issues += 1;
        }
        
        if (!$health_data['ssl']['enabled']) {
            $issues += 2; // Critical
        }
        
        if ($health_data['security']['debug_mode']) {
            $issues += 1;
        }
        
        if ($issues >= 3) {
            return 'critical';
        } elseif ($issues >= 1) {
            return 'warning';
        }
        
        return 'ok';
    }
    
    /**
     * Get plugin status
     */
    private function get_plugin_status() {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $all_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', []);
        $update_plugins = get_site_transient('update_plugins');
        
        $outdated = [];
        $outdated_count = 0;
        
        if (isset($update_plugins->response) && is_array($update_plugins->response)) {
            foreach ($update_plugins->response as $plugin_path => $plugin_data) {
                $outdated_count++;
                $outdated[] = [
                    'name' => $all_plugins[$plugin_path]['Name'] ?? $plugin_path,
                    'current_version' => $all_plugins[$plugin_path]['Version'] ?? 'unknown',
                    'new_version' => $plugin_data->new_version ?? 'unknown',
                    'slug' => $plugin_data->slug ?? '',
                ];
            }
        }
        
        return [
            'total_count' => count($all_plugins),
            'active_count' => count($active_plugins),
            'outdated_count' => $outdated_count,
            'outdated_plugins' => $outdated,
        ];
    }
    
    /**
     * Get theme status
     */
    private function get_theme_status() {
        $theme = wp_get_theme();
        $update_themes = get_site_transient('update_themes');
        
        $theme_slug = $theme->get_stylesheet();
        $update_available = isset($update_themes->response[$theme_slug]);
        
        return [
            'name' => $theme->get('Name'),
            'version' => $theme->get('Version'),
            'parent' => $theme->parent() ? $theme->parent()->get('Name') : null,
            'update_available' => $update_available,
            'new_version' => $update_available ? $update_themes->response[$theme_slug]['new_version'] : null,
        ];
    }
    
    /**
     * Get disk usage
     */
    private function get_disk_usage() {
        $upload_dir = wp_upload_dir();
        
        $data = [
            'uploads_path' => $upload_dir['basedir'],
        ];
        
        if (function_exists('disk_free_space') && @disk_free_space(ABSPATH)) {
            $data['free_space'] = size_format(@disk_free_space(ABSPATH));
            $data['free_space_bytes'] = @disk_free_space(ABSPATH);
        }
        
        if (function_exists('disk_total_space') && @disk_total_space(ABSPATH)) {
            $data['total_space'] = size_format(@disk_total_space(ABSPATH));
            $data['total_space_bytes'] = @disk_total_space(ABSPATH);
        }
        
        return $data;
    }
    
    /**
     * Get update status
     */
    private function get_update_status() {
        $core_updates = get_site_transient('update_core');
        $core_update_available = false;
        $new_version = null;
        
        if (isset($core_updates->updates) && is_array($core_updates->updates)) {
            foreach ($core_updates->updates as $update) {
                if ($update->response === 'upgrade') {
                    $core_update_available = true;
                    $new_version = $update->version;
                    break;
                }
            }
        }
        
        return [
            'core_update_available' => $core_update_available,
            'core_new_version' => $new_version,
            'current_version' => get_bloginfo('version'),
            'last_checked' => get_option('_site_transient_timeout_update_core') 
                ? date('c', get_option('_site_transient_timeout_update_core') - DAY_IN_SECONDS) 
                : null,
        ];
    }
    
    /**
     * Get security status
     */
    private function get_security_status() {
        return [
            'debug_mode' => defined('WP_DEBUG') && WP_DEBUG,
            'debug_log' => defined('WP_DEBUG_LOG') && WP_DEBUG_LOG,
            'debug_display' => defined('WP_DEBUG_DISPLAY') && WP_DEBUG_DISPLAY,
            'file_editing_disabled' => defined('DISALLOW_FILE_EDIT') && DISALLOW_FILE_EDIT,
            'file_mods_disabled' => defined('DISALLOW_FILE_MODS') && DISALLOW_FILE_MODS,
            'auto_updates_core' => defined('WP_AUTO_UPDATE_CORE') ? WP_AUTO_UPDATE_CORE : 'not_set',
            'https_login' => defined('FORCE_SSL_LOGIN') && FORCE_SSL_LOGIN,
            'https_admin' => defined('FORCE_SSL_ADMIN') && FORCE_SSL_ADMIN,
        ];
    }
    
    /**
     * Get performance data
     */
    private function get_performance_data() {
        return [
            'memory_usage' => size_format(memory_get_usage(true)),
            'memory_peak' => size_format(memory_get_peak_usage(true)),
            'php_memory_limit' => ini_get('memory_limit'),
            'wp_memory_limit' => WP_MEMORY_LIMIT,
            'wp_max_memory_limit' => defined('WP_MAX_MEMORY_LIMIT') ? WP_MAX_MEMORY_LIMIT : 'not_set',
        ];
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('LSM Health Monitor', 'lsm-health-monitor'),
            __('LSM Health Monitor', 'lsm-health-monitor'),
            'manage_options',
            'lsm-health-monitor',
            [$this, 'render_admin_page']
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('lsm_health_monitor', self::OPTION_LICENSE);
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_lsm-health-monitor') {
            return;
        }
        
        wp_enqueue_style(
            'lsm-admin-style',
            LSM_HEALTH_PLUGIN_URL . 'assets/css/admin.css',
            [],
            LSM_HEALTH_VERSION
        );
        
        wp_enqueue_script(
            'lsm-admin-script',
            LSM_HEALTH_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            LSM_HEALTH_VERSION,
            true
        );
        
        wp_localize_script('lsm-admin-script', 'lsmAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lsm_admin_nonce'),
            'strings' => [
                'activating' => __('Activating...', 'lsm-health-monitor'),
                'deactivating' => __('Deactivating...', 'lsm-health-monitor'),
                'regenerating' => __('Regenerating...', 'lsm-health-monitor'),
                'confirmRegenerate' => __('This will invalidate the current secret key. All monitoring connections will need to be updated. Continue?', 'lsm-health-monitor'),
                'confirmDeactivate' => __('Are you sure you want to deactivate this license?', 'lsm-health-monitor'),
            ],
        ]);
    }
    
    /**
     * Render admin page
     */
    public function render_admin_page() {
        $secret = get_option(self::OPTION_SECRET);
        $license = get_option(self::OPTION_LICENSE);
        $license_status = get_option(self::OPTION_LICENSE_STATUS, 'inactive');
        $license_data = get_option(self::OPTION_LICENSE_DATA, []);
        $endpoint_url = rest_url('lsm/v1/health');
        
        include LSM_HEALTH_PLUGIN_DIR . 'templates/admin-page.php';
    }
    
    /**
     * Admin notices
     */
    public function admin_notices() {
        // Only show on plugin page or dashboard
        $screen = get_current_screen();
        if (!$screen || !in_array($screen->id, ['settings_page_lsm-health-monitor', 'dashboard', 'plugins'])) {
            return;
        }
        
        if (!$this->is_license_valid()) {
            ?>
            <div class="notice notice-warning">
                <p>
                    <strong><?php _e('LSM Health Monitor:', 'lsm-health-monitor'); ?></strong>
                    <?php _e('Please activate your license to enable health monitoring.', 'lsm-health-monitor'); ?>
                    <a href="<?php echo admin_url('options-general.php?page=lsm-health-monitor'); ?>">
                        <?php _e('Activate License', 'lsm-health-monitor'); ?>
                    </a>
                </p>
            </div>
            <?php
        }
    }
    
    /**
     * Plugin action links
     */
    public function plugin_action_links($links) {
        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            admin_url('options-general.php?page=lsm-health-monitor'),
            __('Settings', 'lsm-health-monitor')
        );
        
        array_unshift($links, $settings_link);
        
        return $links;
    }
    
    /**
     * AJAX: Activate license
     */
    public function ajax_activate_license() {
        check_ajax_referer('lsm_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Unauthorized', 'lsm-health-monitor')]);
        }
        
        $license_key = sanitize_text_field($_POST['license_key'] ?? '');
        
        if (empty($license_key)) {
            wp_send_json_error(['message' => __('Please enter a license key', 'lsm-health-monitor')]);
        }
        
        // Validate license with LSM server
        $result = $this->validate_license_with_server($license_key, 'activate');
        
        if ($result['success']) {
            update_option(self::OPTION_LICENSE, $license_key);
            update_option(self::OPTION_LICENSE_STATUS, 'active');
            update_option(self::OPTION_LICENSE_DATA, $result['data'] ?? []);
            
            wp_send_json_success([
                'message' => __('License activated successfully!', 'lsm-health-monitor'),
                'data' => $result['data'] ?? [],
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['message'] ?? __('License activation failed', 'lsm-health-monitor'),
            ]);
        }
    }
    
    /**
     * AJAX: Deactivate license
     */
    public function ajax_deactivate_license() {
        check_ajax_referer('lsm_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Unauthorized', 'lsm-health-monitor')]);
        }
        
        $license_key = get_option(self::OPTION_LICENSE);
        
        // Deactivate on server
        $this->validate_license_with_server($license_key, 'deactivate');
        
        // Clear local license data
        delete_option(self::OPTION_LICENSE);
        update_option(self::OPTION_LICENSE_STATUS, 'inactive');
        delete_option(self::OPTION_LICENSE_DATA);
        
        wp_send_json_success([
            'message' => __('License deactivated successfully', 'lsm-health-monitor'),
        ]);
    }
    
    /**
     * AJAX: Regenerate secret
     */
    public function ajax_regenerate_secret() {
        check_ajax_referer('lsm_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Unauthorized', 'lsm-health-monitor')]);
        }
        
        $new_secret = $this->generate_secret_key();
        update_option(self::OPTION_SECRET, $new_secret);
        
        wp_send_json_success([
            'message' => __('Secret key regenerated successfully', 'lsm-health-monitor'),
            'secret' => $new_secret,
        ]);
    }
    
    /**
     * Validate license with LSM server
     */
    private function validate_license_with_server($license_key, $action = 'check') {
        // For development/testing: Accept any license key that starts with 'LSM-'
        // In production, this would make an actual API call to the LSM server
        
        // Simulated validation - replace with actual API call
        if (defined('LSM_DEV_MODE') && LSM_DEV_MODE) {
            // Development mode - accept any LSM- prefixed key
            if (strpos($license_key, 'LSM-') === 0) {
                return [
                    'success' => true,
                    'data' => [
                        'license_key' => $license_key,
                        'status' => 'active',
                        'expires' => date('Y-m-d', strtotime('+1 year')),
                        'site_count' => 1,
                        'max_sites' => 1,
                    ],
                ];
            }
            return ['success' => false, 'message' => __('Invalid license key format', 'lsm-health-monitor')];
        }
        
        // Production: Make API call to LSM server
        $api_url = LSM_SERVER_URL . '/api/license/' . $action;
        
        $response = wp_remote_post($api_url, [
            'timeout' => 15,
            'body' => [
                'license_key' => $license_key,
                'site_url' => get_site_url(),
                'site_name' => get_bloginfo('name'),
                'plugin_version' => LSM_HEALTH_VERSION,
            ],
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message(),
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'message' => __('Invalid response from license server', 'lsm-health-monitor'),
            ];
        }
        
        return $data;
    }
    
    /**
     * Deactivate license on server when plugin is deactivated
     */
    private function deactivate_license_on_server() {
        $license_key = get_option(self::OPTION_LICENSE);
        if ($license_key) {
            $this->validate_license_with_server($license_key, 'deactivate');
        }
    }
    
    /**
     * Daily license check
     */
    public function daily_license_check() {
        $license_key = get_option(self::OPTION_LICENSE);
        
        if (empty($license_key)) {
            return;
        }
        
        $result = $this->validate_license_with_server($license_key, 'check');
        
        if (!$result['success']) {
            update_option(self::OPTION_LICENSE_STATUS, 'invalid');
        } else {
            update_option(self::OPTION_LICENSE_STATUS, 'active');
            update_option(self::OPTION_LICENSE_DATA, $result['data'] ?? []);
        }
    }
}

// Initialize plugin
LSM_Health_Monitor::get_instance();
