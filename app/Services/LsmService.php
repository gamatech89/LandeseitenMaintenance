<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response;

class LsmService
{
    protected const API_NAMESPACE = '/wp-json/lsm/v1';
    protected const DEFAULT_TIMEOUT = 30;

    protected Project $project;
    protected ?string $apiKey;
    protected string $baseUrl;

    public function __construct(Project $project)
    {
        $this->project = $project;
        $this->apiKey = $project->health_check_secret;
        $this->baseUrl = rtrim($project->url, '/') . self::API_NAMESPACE;
    }

    public static function for(Project $project): self
    {
        return new self($project);
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->project->url);
    }

    /**
     * Test connectivity to the LSM plugin.
     */
    public function testConnection(): array
    {
        try {
            $response = Http::timeout(10)
                ->get(rtrim($this->project->url, '/') . self::API_NAMESPACE . '/info');

            if ($response->successful()) {
                $data = $response->json();
                $success = $data['success'] ?? false; // LSM /info returns { success: true, data: { ... } }
                
                if ($success) {
                    $pluginData = $data['data'] ?? [];
                    return [
                        'connected' => true,
                        'plugin' => $pluginData['plugin'] ?? 'Landeseiten Maintenance',
                        'version' => $pluginData['version'] ?? '1.0.0',
                        'status' => $pluginData['status'] ?? 'active',
                    ];
                }
            }
            
            return [
                 'connected' => false,
                 'error' => "HTTP {$response->status()}",
                 'body' => $response->body()
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    // =========================================================================
    // API METHODS
    // =========================================================================

    public function getHealth(): ?array
    {
        return $this->get('/health');
    }

    /**
     * Get recovery status.
     * Since LSM doesn't have a dedicated recovery status endpoint, 
     * we derive it from health data which now includes maintenance_mode.
     */
    public function getRecoveryStatus(): ?array
    {
        $health = $this->get('/health');
        
        if (!$health) {
            return null;
        }

        // Determine maintenance mode
        // 1. Prefer direct value from health response (if plugin updated)
        if (isset($health['maintenance_mode'])) {
            $isMaintenance = (bool) $health['maintenance_mode'];
        } else {
            // 2. Fallback: Probe the site homepage for 503 status
            // An anonymous request should receive 503 if maintenance is active
            try {
                $response = Http::timeout(5)->get($this->project->url);
                $isMaintenance = $response->status() === 503;
            } catch (\Exception $e) {
                // If connection fails entirely, we can't be sure, but standard maintenance is 503.
                // If it's a DNS error or timeout, assume false or handle error.
                // For now, assume false to avoid false positives.
                $isMaintenance = false;
            }
        }

        // Map health data to expected recovery status format for frontend
        return [
            'maintenance_mode' => $isMaintenance,
            // Add identifying info if needed
            'active_plugins' => $health['active_plugins'] ?? ($health['plugins']['active'] ?? 0),
            'current_theme' => $health['current_theme']['name'] ?? ($health['themes']['current']['name'] ?? 'Unknown'),
        ];
    }

    public function getAvailableUpdates(): ?array
    {
        return $this->get('/updates');
    }

    public function enableMaintenance(): ?array
    {
        return $this->post('/maintenance/enable');
    }

    public function disableMaintenance(): ?array
    {
        return $this->post('/maintenance/disable');
    }

    public function clearCache(): ?array
    {
        return $this->post('/cache/clear');
    }
    
    public function optimizeDatabase(): ?array
    {
        return $this->post('/database/optimize');
    }

    public function flushRewriteRules(): ?array
    {
        return $this->post('/rewrite/flush');
    }
    
    public function updateCore(): ?array
    {
        return $this->post('/updates/core');
    }
    
    public function updatePlugins(): ?array 
    {
        // Updates all plugins
         return $this->post('/updates/plugins');
    }

    public function disableAllPlugins(): ?array
    {
        return $this->post('/recovery/disable-plugins');
    }

    public function restorePlugins(): ?array
    {
        return $this->post('/recovery/restore-plugins');
    }

    public function emergencyRecovery(): ?array
    {
        return $this->post('/recovery/emergency');
    }

    public function generateLoginToken(string $role = 'administrator'): ?array
    {
        return $this->post('/sso/token', [
            'role' => $role,
            'bind_ip' => request()->ip(),
            'dashboard_user' => auth()->user() ? auth()->user()->email : 'system',
        ]);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    protected function get(string $endpoint, array $params = []): ?array
    {
        if (!$this->isConfigured()) return null;

        try {
            // Add key to params
            $params['key'] = $this->apiKey;
            
            $response = Http::timeout(self::DEFAULT_TIMEOUT)
                ->get($this->baseUrl . $endpoint, $params);

            return $this->handleResponse($response);
        } catch (\Exception $e) {
            Log::error("LSM API Error ({$endpoint}): {$e->getMessage()}");
            return null;
        }
    }

    protected function post(string $endpoint, array $data = []): ?array
    {
        if (!$this->isConfigured()) return null;

        try {
            // Add key via query param for authentication (LSM supports it)
            $url = $this->baseUrl . $endpoint . '?key=' . $this->apiKey;
            
            $response = Http::timeout(self::DEFAULT_TIMEOUT)
                ->asJson() // Ensure JSON content type
                ->post($url, $data);

            return $this->handleResponse($response);
        } catch (\Exception $e) {
            Log::error("LSM API Error ({$endpoint}): {$e->getMessage()}");
            return null;
        }
    }

    protected function handleResponse(Response $response): ?array
    {
        if (!$response->successful()) {
            Log::warning("LSM API Error: {$response->status()} - {$response->body()}");
            return null;
        }

        $json = $response->json();
        
        // LSM standard response is { success: true, data: ... }
        if (isset($json['success']) && $json['success'] && isset($json['data'])) {
            return $json['data'];
        }
        
        // Some endpoints might return data directly or just success boolean
        return $json;
    }
}
