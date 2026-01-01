<?php
/**
 * Plugin Name: LSM Health Monitor
 * Plugin URI: https://your-lsm-app.com
 * Description: Exposes a secure health check endpoint for Landeseiten Management monitoring.
 * Version: 1.0.0
 * Author: Your Company
 * License: GPL v2 or later
 * 
 * INSTALLATION:
 * 1. Upload this file to /wp-content/plugins/lsm-health-monitor/lsm-health-monitor.php
 * 2. Activate the plugin in WordPress admin
 * 3. Go to Settings > LSM Health Monitor to get your secret key
 * 4. Add the secret key to your project in LSM
 */

if (!defined('ABSPATH')) {
    exit;
}

class LSM_Health_Monitor {
    
    private $option_name = 'lsm_health_secret';
    
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
        
        // Generate secret on activation
        register_activation_hook(__FILE__, [$this, 'generate_secret']);
    }
    
    /**
     * Generate a unique secret key on plugin activation.
     */
    public function generate_secret() {
        if (!get_option($this->option_name)) {
            update_option($this->option_name, wp_generate_password(32, false));
        }
    }
    
    /**
     * Register REST API routes.
     */
    public function register_routes() {
        register_rest_route('lsm/v1', '/health', [
            'methods' => 'GET',
            'callback' => [$this, 'health_check'],
            'permission_callback' => [$this, 'verify_secret'],
        ]);
    }
    
    /**
     * Verify the secret key from the request.
     */
    public function verify_secret($request) {
        $provided_key = $request->get_param('key');
        $stored_key = get_option($this->option_name);
        
        if (empty($stored_key)) {
            return false;
        }
        
        return hash_equals($stored_key, $provided_key);
    }
    
    /**
     * Return comprehensive health information.
     */
    public function health_check($request) {
        global $wpdb;
        
        $health_data = [
            'status' => 'ok',
            'timestamp' => current_time('c'),
            'site_url' => get_site_url(),
            
            // WordPress Core
            'wordpress' => [
                'version' => get_bloginfo('version'),
                'is_multisite' => is_multisite(),
                'locale' => get_locale(),
            ],
            
            // PHP Info
            'php' => [
                'version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
            ],
            
            // Database
            'database' => [
                'version' => $wpdb->db_version(),
                'prefix' => $wpdb->prefix,
                'charset' => $wpdb->charset,
            ],
            
            // Plugins
            'plugins' => $this->get_plugin_status(),
            
            // Theme
            'theme' => [
                'name' => wp_get_theme()->get('Name'),
                'version' => wp_get_theme()->get('Version'),
                'parent' => wp_get_theme()->parent() ? wp_get_theme()->parent()->get('Name') : null,
            ],
            
            // SSL
            'ssl' => [
                'enabled' => is_ssl(),
            ],
            
            // Disk Usage (if available)
            'disk' => $this->get_disk_usage(),
            
            // Updates Available
            'updates' => $this->get_update_status(),
            
            // Security Checks
            'security' => $this->get_security_status(),
        ];
        
        // Check for critical issues
        if ($health_data['updates']['core_update_available'] || 
            $health_data['plugins']['outdated_count'] > 5 ||
            !$health_data['ssl']['enabled']) {
            $health_data['status'] = 'warning';
        }
        
        return rest_ensure_response($health_data);
    }
    
    /**
     * Get plugin update status.
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
                    'name' => isset($all_plugins[$plugin_path]) ? $all_plugins[$plugin_path]['Name'] : $plugin_path,
                    'current_version' => isset($all_plugins[$plugin_path]) ? $all_plugins[$plugin_path]['Version'] : 'unknown',
                    'new_version' => $plugin_data->new_version ?? 'unknown',
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
     * Get disk usage information.
     */
    private function get_disk_usage() {
        $upload_dir = wp_upload_dir();
        
        return [
            'uploads_path' => $upload_dir['basedir'],
            // These might not be available on all hosts
            'free_space' => function_exists('disk_free_space') ? size_format(disk_free_space(ABSPATH)) : 'N/A',
            'total_space' => function_exists('disk_total_space') ? size_format(disk_total_space(ABSPATH)) : 'N/A',
        ];
    }
    
    /**
     * Get update availability status.
     */
    private function get_update_status() {
        $core_updates = get_site_transient('update_core');
        $core_update_available = false;
        
        if (isset($core_updates->updates) && is_array($core_updates->updates)) {
            foreach ($core_updates->updates as $update) {
                if ($update->response === 'upgrade') {
                    $core_update_available = true;
                    break;
                }
            }
        }
        
        return [
            'core_update_available' => $core_update_available,
            'last_checked' => get_option('_site_transient_timeout_update_core') 
                ? date('c', get_option('_site_transient_timeout_update_core') - DAY_IN_SECONDS) 
                : null,
        ];
    }
    
    /**
     * Basic security checks.
     */
    private function get_security_status() {
        return [
            'debug_mode' => WP_DEBUG,
            'debug_log' => defined('WP_DEBUG_LOG') && WP_DEBUG_LOG,
            'file_editing_disabled' => defined('DISALLOW_FILE_EDIT') && DISALLOW_FILE_EDIT,
            'xmlrpc_enabled' => true, // Could check with filters but this is default
        ];
    }
    
    /**
     * Add settings page to admin menu.
     */
    public function add_settings_page() {
        add_options_page(
            'LSM Health Monitor',
            'LSM Health Monitor',
            'manage_options',
            'lsm-health-monitor',
            [$this, 'render_settings_page']
        );
    }
    
    /**
     * Register plugin settings.
     */
    public function register_settings() {
        register_setting('lsm_health_monitor', $this->option_name);
    }
    
    /**
     * Render the settings page.
     */
    public function render_settings_page() {
        $secret = get_option($this->option_name);
        $endpoint_url = rest_url('lsm/v1/health') . '?key=' . $secret;
        ?>
        <div class="wrap">
            <h1>LSM Health Monitor</h1>
            
            <div class="card" style="max-width: 600px; padding: 20px;">
                <h2>Your Health Check Endpoint</h2>
                <p>Add this URL to your project in Landeseiten Management:</p>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; word-break: break-all; margin: 15px 0;">
                    <code style="font-size: 12px;"><?php echo esc_html($endpoint_url); ?></code>
                </div>
                
                <p><strong>Secret Key:</strong></p>
                <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0;">
                    <code><?php echo esc_html($secret); ?></code>
                </div>
                
                <p>
                    <a href="<?php echo esc_url($endpoint_url); ?>" target="_blank" class="button button-secondary">
                        Test Endpoint
                    </a>
                    
                    <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" style="display: inline;">
                        <?php wp_nonce_field('regenerate_lsm_secret'); ?>
                        <input type="hidden" name="action" value="regenerate_lsm_secret">
                        <button type="submit" class="button" onclick="return confirm('This will invalidate the current secret. Continue?');">
                            Regenerate Secret
                        </button>
                    </form>
                </p>
            </div>
            
            <div class="card" style="max-width: 600px; padding: 20px; margin-top: 20px;">
                <h2>What Data Is Shared?</h2>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li>WordPress, PHP, and MySQL versions</li>
                    <li>Number of active and outdated plugins</li>
                    <li>Theme information</li>
                    <li>SSL status</li>
                    <li>Available updates</li>
                    <li>Basic security configuration</li>
                </ul>
                <p><em>No sensitive data, passwords, or user information is shared.</em></p>
            </div>
        </div>
        <?php
    }
}

// Handle secret regeneration
add_action('admin_post_regenerate_lsm_secret', function() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    check_admin_referer('regenerate_lsm_secret');
    
    update_option('lsm_health_secret', wp_generate_password(32, false));
    
    wp_redirect(admin_url('options-general.php?page=lsm-health-monitor&regenerated=1'));
    exit;
});

// Initialize the plugin
new LSM_Health_Monitor();
