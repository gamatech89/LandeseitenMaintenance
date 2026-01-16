<?php
/**
 * Site actions for Landeseiten Maintenance.
 *
 * @package Landeseiten_Maintenance
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * LSM Actions class.
 */
class LSM_Actions {

    /**
     * Clear all caches.
     *
     * @return array Result with cleared caches.
     */
    public static function clear_cache() {
        $cleared = [];

        // WP Super Cache
        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
            $cleared[] = 'wp_super_cache';
        }

        // W3 Total Cache
        if (function_exists('w3tc_flush_all')) {
            w3tc_flush_all();
            $cleared[] = 'w3_total_cache';
        }

        // WP Fastest Cache
        if (class_exists('WpFastestCache')) {
            $wpfc = new WpFastestCache();
            if (method_exists($wpfc, 'deleteCache')) {
                $wpfc->deleteCache();
                $cleared[] = 'wp_fastest_cache';
            }
        }

        // LiteSpeed Cache
        if (class_exists('LiteSpeed_Cache_API')) {
            LiteSpeed_Cache_API::purge_all();
            $cleared[] = 'litespeed_cache';
        }

        // WP Rocket
        if (function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
            $cleared[] = 'wp_rocket';
        }

        // Autoptimize
        if (class_exists('autoptimizeCache')) {
            autoptimizeCache::clearall();
            $cleared[] = 'autoptimize';
        }

        // SG Optimizer
        if (function_exists('sg_cachepress_purge_cache')) {
            sg_cachepress_purge_cache();
            $cleared[] = 'sg_optimizer';
        }

        // Object cache
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
            $cleared[] = 'object_cache';
        }

        LSM_Logger::log('cache_cleared', 'success', [
            'cleared' => $cleared,
        ]);

        return [
            'success' => true,
            'cleared' => $cleared,
            'count'   => count($cleared),
        ];
    }

    /**
     * Flush rewrite rules.
     *
     * @return array Result.
     */
    public static function flush_rewrite() {
        flush_rewrite_rules();

        LSM_Logger::log('rewrite_flushed', 'success', []);

        return [
            'success' => true,
            'message' => __('Rewrite rules flushed.', 'landeseiten-maintenance'),
        ];
    }

    /**
     * Optimize database.
     *
     * @return array Result with optimization details.
     */
    public static function optimize_database() {
        global $wpdb;

        $tables = $wpdb->get_results("SHOW TABLES LIKE '{$wpdb->prefix}%'", ARRAY_N);
        $optimized = 0;
        $size_before = 0;
        $size_after = 0;

        foreach ($tables as $table) {
            $table_name = $table[0];

            // Get size before
            $status = $wpdb->get_row("SHOW TABLE STATUS LIKE '$table_name'");
            if ($status) {
                $size_before += $status->Data_length + $status->Index_length;
            }

            // Optimize
            $wpdb->query("OPTIMIZE TABLE `$table_name`");
            $optimized++;

            // Get size after
            $status = $wpdb->get_row("SHOW TABLE STATUS LIKE '$table_name'");
            if ($status) {
                $size_after += $status->Data_length + $status->Index_length;
            }
        }

        $saved = $size_before - $size_after;

        LSM_Logger::log('database_optimized', 'success', [
            'tables'      => $optimized,
            'saved_bytes' => $saved,
        ]);

        return [
            'success'      => true,
            'tables_count' => $optimized,
            'size_before'  => size_format($size_before),
            'size_after'   => size_format($size_after),
            'saved'        => size_format($saved),
        ];
    }

    /**
     * Get available updates.
     *
     * @return array Updates info.
     */
    public static function get_updates() {
        if (!function_exists('get_plugin_updates')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }

        // Force update check
        wp_update_plugins();
        wp_update_themes();

        $plugin_updates = get_plugin_updates();
        $theme_updates = get_theme_updates();
        $core_updates = get_core_updates();

        $plugins = [];
        foreach ($plugin_updates as $file => $data) {
            $plugins[] = [
                'file'        => $file,
                'name'        => $data->Name,
                'current'     => $data->Version,
                'new_version' => $data->update->new_version,
            ];
        }

        $themes = [];
        foreach ($theme_updates as $slug => $data) {
            $themes[] = [
                'slug'        => $slug,
                'name'        => $data->get('Name'),
                'current'     => $data->get('Version'),
                'new_version' => $data->update['new_version'],
            ];
        }

        $core = null;
        if (!empty($core_updates) && $core_updates[0]->response === 'upgrade') {
            $core = [
                'current'     => get_bloginfo('version'),
                'new_version' => $core_updates[0]->version,
            ];
        }

        return [
            'plugins' => $plugins,
            'themes'  => $themes,
            'core'    => $core,
            'total'   => count($plugins) + count($themes) + ($core ? 1 : 0),
        ];
    }

    /**
     * Update all plugins.
     *
     * @return array Result.
     */
    public static function update_all_plugins() {
        if (!function_exists('get_plugin_updates')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        $plugin_updates = get_plugin_updates();
        $updated = [];
        $failed = [];

        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());

        foreach ($plugin_updates as $file => $data) {
            $result = $upgrader->upgrade($file);
            if ($result && !is_wp_error($result)) {
                $updated[] = $data->Name;
            } else {
                $failed[] = $data->Name;
            }
        }

        LSM_Logger::log('plugins_updated', 'success', [
            'updated' => count($updated),
            'failed'  => count($failed),
        ]);

        return [
            'success'       => true,
            'updated'       => $updated,
            'failed'        => $failed,
            'updated_count' => count($updated),
        ];
    }

    /**
     * Update WordPress core.
     *
     * @return array Result.
     */
    public static function update_core() {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/update.php';

        $core_updates = get_core_updates();
        if (empty($core_updates) || $core_updates[0]->response !== 'upgrade') {
            return [
                'success' => false,
                'message' => __('No core update available.', 'landeseiten-maintenance'),
            ];
        }

        $upgrader = new Core_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->upgrade($core_updates[0]);

        if (is_wp_error($result)) {
            return [
                'success' => false,
                'message' => $result->get_error_message(),
            ];
        }

        LSM_Logger::log('core_updated', 'success', [
            'version' => $core_updates[0]->version,
        ]);

        return [
            'success'     => true,
            'new_version' => $core_updates[0]->version,
        ];
    }
}
