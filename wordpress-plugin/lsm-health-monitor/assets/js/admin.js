/**
 * LSM Health Monitor Admin JavaScript
 */

(function($) {
    'use strict';
    
    // License activation form
    $('#lsm-license-form').on('submit', function(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $btn = $('#lsm-activate-btn');
        var $message = $('#lsm-license-message');
        var licenseKey = $('#lsm-license-key').val();
        
        if (!licenseKey) {
            showMessage($message, 'error', 'Please enter a license key');
            return;
        }
        
        $btn.text(lsmAdmin.strings.activating).prop('disabled', true);
        $form.addClass('lsm-loading');
        
        $.ajax({
            url: lsmAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'lsm_activate_license',
                nonce: lsmAdmin.nonce,
                license_key: licenseKey
            },
            success: function(response) {
                if (response.success) {
                    showMessage($message, 'success', response.data.message);
                    setTimeout(function() {
                        location.reload();
                    }, 1500);
                } else {
                    showMessage($message, 'error', response.data.message);
                    $btn.text('Activate License').prop('disabled', false);
                    $form.removeClass('lsm-loading');
                }
            },
            error: function() {
                showMessage($message, 'error', 'Connection error. Please try again.');
                $btn.text('Activate License').prop('disabled', false);
                $form.removeClass('lsm-loading');
            }
        });
    });
    
    // License deactivation
    $('#lsm-deactivate-btn').on('click', function() {
        if (!confirm(lsmAdmin.strings.confirmDeactivate)) {
            return;
        }
        
        var $btn = $(this);
        var $message = $('#lsm-license-message');
        
        $btn.text(lsmAdmin.strings.deactivating).prop('disabled', true);
        
        $.ajax({
            url: lsmAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'lsm_deactivate_license',
                nonce: lsmAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    showMessage($message, 'success', response.data.message);
                    setTimeout(function() {
                        location.reload();
                    }, 1500);
                } else {
                    showMessage($message, 'error', response.data.message);
                    $btn.text('Deactivate License').prop('disabled', false);
                }
            },
            error: function() {
                showMessage($message, 'error', 'Connection error. Please try again.');
                $btn.text('Deactivate License').prop('disabled', false);
            }
        });
    });
    
    // Regenerate secret
    $('#lsm-regenerate-btn').on('click', function() {
        if (!confirm(lsmAdmin.strings.confirmRegenerate)) {
            return;
        }
        
        var $btn = $(this);
        var $message = $('#lsm-connection-message');
        
        $btn.text(lsmAdmin.strings.regenerating).prop('disabled', true);
        
        $.ajax({
            url: lsmAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'lsm_regenerate_secret',
                nonce: lsmAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    showMessage($message, 'success', response.data.message);
                    
                    // Update the secret key field
                    $('#lsm-secret-key').val(response.data.secret);
                    
                    // Update the full URL
                    var endpointUrl = $('#lsm-endpoint-url').val();
                    $('#lsm-full-url').val(endpointUrl + '?key=' + response.data.secret);
                    
                    $btn.html('<span class="dashicons dashicons-update"></span> Regenerate Secret').prop('disabled', false);
                } else {
                    showMessage($message, 'error', response.data.message);
                    $btn.html('<span class="dashicons dashicons-update"></span> Regenerate Secret').prop('disabled', false);
                }
            },
            error: function() {
                showMessage($message, 'error', 'Connection error. Please try again.');
                $btn.html('<span class="dashicons dashicons-update"></span> Regenerate Secret').prop('disabled', false);
            }
        });
    });
    
    // Copy to clipboard
    $('.lsm-copy-btn').on('click', function() {
        var targetId = $(this).data('copy');
        var $input = $('#' + targetId);
        var $btn = $(this);
        
        // Select the text
        $input.select();
        $input[0].setSelectionRange(0, 99999); // For mobile
        
        // Copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText($input.val()).then(function() {
                showCopiedFeedback($btn);
            });
        } else {
            // Fallback
            document.execCommand('copy');
            showCopiedFeedback($btn);
        }
    });
    
    // Show copied feedback
    function showCopiedFeedback($btn) {
        var originalHtml = $btn.html();
        $btn.html('<span class="dashicons dashicons-yes"></span>');
        $btn.css('color', '#22c55e');
        
        setTimeout(function() {
            $btn.html(originalHtml);
            $btn.css('color', '');
        }, 1500);
    }
    
    // Show message helper
    function showMessage($element, type, message) {
        $element
            .removeClass('success error')
            .addClass(type)
            .text(message)
            .slideDown();
        
        if (type === 'success') {
            setTimeout(function() {
                $element.slideUp();
            }, 5000);
        }
    }
    
})(jQuery);
