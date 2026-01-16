<?php
/**
 * REST API endpoints for Landeseiten Maintenance.
 *
 * @package Landeseiten_Maintenance
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * LSM API class.
 */
class LSM_API {

    /**
     * API namespace.
     */
    const NAMESPACE = 'lsm/v1';

    /**
     * Register routes.
     */
    public function register_routes() {
        // Public info endpoint
        register_rest_route(self::NAMESPACE, '/info', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_info'],
            'permission_callback' => '__return_true',
        ]);

        // Authenticated endpoints
        register_rest_route(self::NAMESPACE, '/health', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_health'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/sso/token', [
            'methods'             => 'POST',
            'callback'            => [$this, 'generate_sso_token'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/cache/clear', [
            'methods'             => 'POST',
            'callback'            => [$this, 'clear_cache'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/database/optimize', [
            'methods'             => 'POST',
            'callback'            => [$this, 'optimize_database'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/rewrite/flush', [
            'methods'             => 'POST',
            'callback'            => [$this, 'flush_rewrite'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/updates', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_updates'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/updates/plugins', [
            'methods'             => 'POST',
            'callback'            => [$this, 'update_plugins'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/updates/core', [
            'methods'             => 'POST',
            'callback'            => [$this, 'update_core'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/maintenance/enable', [
            'methods'             => 'POST',
            'callback'            => [$this, 'enable_maintenance'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/maintenance/disable', [
            'methods'             => 'POST',
            'callback'            => [$this, 'disable_maintenance'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/recovery/disable-plugins', [
            'methods'             => 'POST',
            'callback'            => [$this, 'disable_plugins'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/recovery/restore-plugins', [
            'methods'             => 'POST',
            'callback'            => [$this, 'restore_plugins'],
            'permission_callback' => [$this, 'authenticate'],
        ]);

        register_rest_route(self::NAMESPACE, '/recovery/emergency', [
            'methods'             => 'POST',
            'callback'            => [$this, 'emergency_recovery'],
            'permission_callback' => [$this, 'authenticate'],
        ]);
    }

    /**
     * Authenticate API request.
     *
     * @param WP_REST_Request $request Request object.
     * @return bool
     */
    public function authenticate($request) {
        $api_key = Landeseiten_Maintenance::get_setting('api_key');
        if (empty($api_key)) {
            return false;
        }

        // Check query param
        $key = $request->get_param('key');
        if ($key === $api_key) {
            return true;
        }

        // Check header
        $auth_header = $request->get_header('X-LSM-Key');
        if ($auth_header === $api_key) {
            return true;
        }

        // Check Authorization header
        $auth = $request->get_header('Authorization');
        if ($auth && preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
            if ($matches[1] === $api_key) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get plugin info.
     */
    public function get_info() {
        return rest_ensure_response([
            'success' => true,
            'data'    => [
                'plugin'  => 'Landeseiten Maintenance',
                'version' => LSM_VERSION,
                'status'  => 'active',
            ],
        ]);
    }

    /**
     * Get health data.
     */
    public function get_health() {
        $health = new LSM_Health();
        return rest_ensure_response([
            'success' => true,
            'data'    => $health->get_health_data(),
        ]);
    }

    /**
     * Generate SSO token.
     *
     * @param WP_REST_Request $request Request.
     */
    public function generate_sso_token($request) {
        $auth = new LSM_Auth();
        $token_data = $auth->generate_login_token(
            $request->get_param('role') ?? 'administrator',
            $request->get_param('expires_in') ?? 300,
            $request->get_param('bind_ip'),
            $request->get_param('dashboard_user')
        );

        return rest_ensure_response([
            'success'   => true,
            'login_url' => $token_data['login_url'],
            'expires'   => $token_data['expires'],
        ]);
    }

    /**
     * Clear cache.
     */
    public function clear_cache() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Actions::clear_cache(),
        ]);
    }

    /**
     * Optimize database.
     */
    public function optimize_database() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Actions::optimize_database(),
        ]);
    }

    /**
     * Flush rewrite rules.
     */
    public function flush_rewrite() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Actions::flush_rewrite(),
        ]);
    }

    /**
     * Get updates.
     */
    public function get_updates() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Actions::get_updates(),
        ]);
    }

    /**
     * Update plugins.
     */
    public function update_plugins() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Actions::update_all_plugins(),
        ]);
    }

    /**
     * Update core.
     */
    public function update_core() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Actions::update_core(),
        ]);
    }

    /**
     * Enable maintenance mode.
     */
    public function enable_maintenance() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Maintenance_Mode::enable(),
        ]);
    }

    /**
     * Disable maintenance mode.
     */
    public function disable_maintenance() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Maintenance_Mode::disable(),
        ]);
    }

    /**
     * Disable all plugins.
     */
    public function disable_plugins() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Recovery::disable_all_plugins(),
        ]);
    }

    /**
     * Restore plugins.
     */
    public function restore_plugins() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Recovery::restore_plugins(),
        ]);
    }

    /**
     * Emergency recovery.
     */
    public function emergency_recovery() {
        return rest_ensure_response([
            'success' => true,
            'data'    => LSM_Recovery::emergency_recovery(),
        ]);
    }
}
