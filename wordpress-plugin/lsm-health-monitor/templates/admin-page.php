<?php
/**
 * Admin page template
 */

if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap lsm-admin-wrap">
    <h1>
        <span class="dashicons dashicons-heart" style="color: #6c1e9f;"></span>
        <?php _e('LSM Health Monitor', 'lsm-health-monitor'); ?>
    </h1>
    
    <div class="lsm-admin-container">
        <!-- License Section -->
        <div class="lsm-card lsm-license-card">
            <h2>
                <span class="dashicons dashicons-admin-network"></span>
                <?php _e('License', 'lsm-health-monitor'); ?>
            </h2>
            
            <div class="lsm-license-status">
                <?php if ($license_status === 'active'): ?>
                    <span class="lsm-status-badge lsm-status-active">
                        <span class="dashicons dashicons-yes-alt"></span>
                        <?php _e('Active', 'lsm-health-monitor'); ?>
                    </span>
                <?php else: ?>
                    <span class="lsm-status-badge lsm-status-inactive">
                        <span class="dashicons dashicons-warning"></span>
                        <?php _e('Inactive', 'lsm-health-monitor'); ?>
                    </span>
                <?php endif; ?>
            </div>
            
            <?php if ($license_status !== 'active'): ?>
                <form id="lsm-license-form" class="lsm-license-form">
                    <div class="lsm-form-group">
                        <label for="lsm-license-key"><?php _e('License Key', 'lsm-health-monitor'); ?></label>
                        <input type="text" 
                               id="lsm-license-key" 
                               name="license_key" 
                               placeholder="LSM-XXXX-XXXX-XXXX-XXXX"
                               value="<?php echo esc_attr($license); ?>"
                               class="regular-text">
                        <p class="description">
                            <?php _e('Enter your license key from Landeseiten Management.', 'lsm-health-monitor'); ?>
                        </p>
                    </div>
                    <button type="submit" class="button button-primary" id="lsm-activate-btn">
                        <?php _e('Activate License', 'lsm-health-monitor'); ?>
                    </button>
                </form>
            <?php else: ?>
                <div class="lsm-license-info">
                    <table class="lsm-info-table">
                        <tr>
                            <th><?php _e('License Key:', 'lsm-health-monitor'); ?></th>
                            <td><code><?php echo esc_html(substr($license, 0, 12) . '...' . substr($license, -4)); ?></code></td>
                        </tr>
                        <?php if (!empty($license_data['expires'])): ?>
                        <tr>
                            <th><?php _e('Expires:', 'lsm-health-monitor'); ?></th>
                            <td><?php echo esc_html($license_data['expires']); ?></td>
                        </tr>
                        <?php endif; ?>
                    </table>
                    
                    <button type="button" class="button" id="lsm-deactivate-btn">
                        <?php _e('Deactivate License', 'lsm-health-monitor'); ?>
                    </button>
                </div>
            <?php endif; ?>
            
            <div id="lsm-license-message" class="lsm-message" style="display: none;"></div>
        </div>
        
        <!-- Connection Info Section -->
        <div class="lsm-card lsm-connection-card <?php echo $license_status !== 'active' ? 'lsm-disabled' : ''; ?>">
            <h2>
                <span class="dashicons dashicons-admin-links"></span>
                <?php _e('Connection Details', 'lsm-health-monitor'); ?>
            </h2>
            
            <?php if ($license_status !== 'active'): ?>
                <div class="lsm-notice lsm-notice-warning">
                    <span class="dashicons dashicons-lock"></span>
                    <?php _e('Activate your license to view connection details.', 'lsm-health-monitor'); ?>
                </div>
            <?php else: ?>
                <div class="lsm-form-group">
                    <label><?php _e('Health Check Endpoint', 'lsm-health-monitor'); ?></label>
                    <div class="lsm-copy-field">
                        <input type="text" readonly value="<?php echo esc_url($endpoint_url); ?>" id="lsm-endpoint-url" class="regular-text">
                        <button type="button" class="button lsm-copy-btn" data-copy="lsm-endpoint-url">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                </div>
                
                <div class="lsm-form-group">
                    <label><?php _e('Secret Key', 'lsm-health-monitor'); ?></label>
                    <div class="lsm-copy-field">
                        <input type="text" readonly value="<?php echo esc_attr($secret); ?>" id="lsm-secret-key" class="regular-text">
                        <button type="button" class="button lsm-copy-btn" data-copy="lsm-secret-key">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                    <p class="description">
                        <?php _e('Add this secret key to your project settings in LSM.', 'lsm-health-monitor'); ?>
                    </p>
                </div>
                
                <div class="lsm-form-group">
                    <label><?php _e('Full Health Check URL', 'lsm-health-monitor'); ?></label>
                    <div class="lsm-copy-field">
                        <input type="text" readonly value="<?php echo esc_url($endpoint_url . '?key=' . $secret); ?>" id="lsm-full-url" class="regular-text lsm-full-url">
                        <button type="button" class="button lsm-copy-btn" data-copy="lsm-full-url">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                </div>
                
                <div class="lsm-actions">
                    <a href="<?php echo esc_url($endpoint_url . '?key=' . $secret); ?>" target="_blank" class="button button-secondary">
                        <span class="dashicons dashicons-external"></span>
                        <?php _e('Test Endpoint', 'lsm-health-monitor'); ?>
                    </a>
                    <button type="button" class="button" id="lsm-regenerate-btn">
                        <span class="dashicons dashicons-update"></span>
                        <?php _e('Regenerate Secret', 'lsm-health-monitor'); ?>
                    </button>
                </div>
                
                <div id="lsm-connection-message" class="lsm-message" style="display: none;"></div>
            <?php endif; ?>
        </div>
        
        <!-- Data Shared Section -->
        <div class="lsm-card lsm-info-card">
            <h2>
                <span class="dashicons dashicons-info"></span>
                <?php _e('What Data Is Shared?', 'lsm-health-monitor'); ?>
            </h2>
            
            <div class="lsm-data-list">
                <ul>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('WordPress, PHP, and MySQL versions', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('Number of active and outdated plugins', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('Theme information', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('SSL/HTTPS status', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('Available updates', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('Basic security configuration', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('Disk usage (if available)', 'lsm-health-monitor'); ?></li>
                    <li><span class="dashicons dashicons-yes"></span> <?php _e('Memory usage statistics', 'lsm-health-monitor'); ?></li>
                </ul>
            </div>
            
            <div class="lsm-notice lsm-notice-info">
                <span class="dashicons dashicons-shield"></span>
                <strong><?php _e('Privacy:', 'lsm-health-monitor'); ?></strong>
                <?php _e('No sensitive data, passwords, user information, or content is ever shared.', 'lsm-health-monitor'); ?>
            </div>
        </div>
        
        <!-- Support Section -->
        <div class="lsm-card lsm-support-card">
            <h2>
                <span class="dashicons dashicons-sos"></span>
                <?php _e('Support', 'lsm-health-monitor'); ?>
            </h2>
            
            <p>
                <?php _e('Need help? Contact us through the LSM dashboard or visit our documentation.', 'lsm-health-monitor'); ?>
            </p>
            
            <div class="lsm-support-links">
                <a href="https://landeseitenmaintenance.site" target="_blank" class="button">
                    <span class="dashicons dashicons-admin-home"></span>
                    <?php _e('LSM Dashboard', 'lsm-health-monitor'); ?>
                </a>
                <a href="https://landeseiten.de" target="_blank" class="button">
                    <span class="dashicons dashicons-book"></span>
                    <?php _e('Documentation', 'lsm-health-monitor'); ?>
                </a>
            </div>
            
            <p class="lsm-version">
                <?php printf(__('Plugin Version: %s', 'lsm-health-monitor'), LSM_HEALTH_VERSION); ?>
            </p>
        </div>
    </div>
</div>
