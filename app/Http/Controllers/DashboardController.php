<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // Cache stats for 5 minutes to reduce DB load
        $stats = Cache::remember('dashboard_stats', 300, function () {
            return $this->getAggregatedStats();
        });

        // Recent projects with issues (not cached - should be fresh)
        $recentIssues = Project::where(function ($query) {
            $query->where('health_status', '!=', 'online')
                  ->orWhere('security_status', 'hacked')
                  ->orWhereIn('security_status', ['at_risk', 'compromised']);
        })
        ->select(['id', 'name', 'url', 'health_status', 'security_status', 'updated_at'])
        ->orderBy('updated_at', 'desc')
        ->limit(5)
        ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentIssues' => $recentIssues,
        ]);
    }

    /**
     * Get all dashboard stats in a single optimized query.
     * Reduces 8 separate COUNT queries to 1 aggregated query.
     */
    private function getAggregatedStats(): array
    {
        $result = DB::table('projects')
            ->whereNull('deleted_at')
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN health_status = 'online' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN health_status IN ('offline', 'down_error') THEN 1 ELSE 0 END) as offline,
                SUM(CASE WHEN health_status IN ('maintenance', 'updating') THEN 1 ELSE 0 END) as maintenance,
                SUM(CASE WHEN security_status = 'secure' THEN 1 ELSE 0 END) as secure,
                SUM(CASE WHEN security_status = 'monitoring' THEN 1 ELSE 0 END) as monitoring,
                SUM(CASE WHEN security_status IN ('at_risk', 'compromised') THEN 1 ELSE 0 END) as at_risk,
                SUM(CASE WHEN security_status = 'hacked' THEN 1 ELSE 0 END) as hacked
            ")
            ->first();

        return [
            'total' => (int) $result->total,
            'online' => (int) $result->online,
            'offline' => (int) $result->offline,
            'maintenance' => (int) $result->maintenance,
            'secure' => (int) $result->secure,
            'monitoring' => (int) $result->monitoring,
            'at_risk' => (int) $result->at_risk,
            'hacked' => (int) $result->hacked,
        ];
    }

    /**
     * Clear dashboard cache (call when projects are updated).
     */
    public static function clearCache(): void
    {
        Cache::forget('dashboard_stats');
    }
}
