=== LSM Health Monitor ===
Contributors: landeseiten
Tags: maintenance, monitoring, health check, wordpress management, security
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Secure health monitoring endpoint for Landeseiten Management (LSM) dashboard. Monitor WordPress sites remotely.

== Description ==

LSM Health Monitor creates a secure REST API endpoint that allows the Landeseiten Management (LSM) dashboard to monitor your WordPress site's health status.

**Features:**

* Secure API endpoint protected by secret key
* License-based activation
* Comprehensive health data reporting
* No sensitive data exposure
* Easy setup and configuration

**What Data Is Monitored:**

* WordPress, PHP, and MySQL versions
* Plugin status (total, active, outdated)
* Theme information and update status
* SSL/HTTPS status
* Available WordPress core updates
* Security configuration (debug mode, file editing, etc.)
* Disk usage statistics
* Memory usage

**Privacy:**

This plugin only shares technical health data about your WordPress installation. No user data, passwords, content, or other sensitive information is ever transmitted.

== Installation ==

1. Upload the `lsm-health-monitor` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > LSM Health Monitor
4. Enter your license key from the LSM dashboard
5. Copy the secret key and add it to your project in LSM

== Frequently Asked Questions ==

= Where do I get a license key? =

License keys are provided through the Landeseiten Management dashboard. Contact your LSM administrator for access.

= What data is shared? =

Only technical health data is shared:
- Software versions (WordPress, PHP, MySQL)
- Plugin and theme status
- Security configuration
- Update availability
- Resource usage

No passwords, user data, or content is ever shared.

= Is the connection secure? =

Yes. All communication uses:
- Unique secret keys per installation
- License validation
- HTTPS encryption (recommended)

= Can I regenerate the secret key? =

Yes, you can regenerate the secret key at any time from the plugin settings page. Note that you'll need to update the key in your LSM project settings.

== Screenshots ==

1. Plugin settings page with license activation
2. Connection details and secret key
3. Health check endpoint response

== Changelog ==

= 1.0.0 =
* Initial release
* Secure health check endpoint
* License activation system
* Admin settings page
* Comprehensive health reporting

== Upgrade Notice ==

= 1.0.0 =
Initial release of LSM Health Monitor.
