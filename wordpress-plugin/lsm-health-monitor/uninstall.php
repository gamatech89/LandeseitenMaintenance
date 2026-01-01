<?php
/**
 * Uninstall LSM Health Monitor
 *
 * This file runs when the plugin is deleted from WordPress.
 * It cleans up all plugin data from the database.
 */

// Exit if accessed directly or not during uninstall
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Options to delete
$options = [
    'lsm_health_secret',
    'lsm_license_key',
    'lsm_license_status',
    'lsm_license_data',
];

// Delete all options
foreach ($options as $option) {
    delete_option($option);
    
    // For multisite
    if (is_multisite()) {
        delete_site_option($option);
    }
}

// Clear any scheduled cron jobs
wp_clear_scheduled_hook('lsm_daily_license_check');

// For multisite: clean up all sites
if (is_multisite()) {
    global $wpdb;
    
    $blog_ids = $wpdb->get_col("SELECT blog_id FROM $wpdb->blogs");
    
    foreach ($blog_ids as $blog_id) {
        switch_to_blog($blog_id);
        
        foreach ($options as $option) {
            delete_option($option);
        }
        
        wp_clear_scheduled_hook('lsm_daily_license_check');
        
        restore_current_blog();
    }
}
