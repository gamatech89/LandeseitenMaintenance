<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total' => Project::count(),

            // Health Status
            'online' => Project::where('health_status', 'online')->count(),
            'down' => Project::where('health_status', 'down_error')->count(),
            'updating' => Project::where('health_status', 'updating')->count(),

            // Security Status
            'secure' => Project::where('security_status', 'secure')->count(),
            'monitoring' => Project::where('security_status', 'monitoring')->count(),
            'compromised' => Project::where('security_status', 'compromised')->count(),
            'hacked' => Project::where('security_status', 'hacked')->count(),
        ];

        // Recent projects with issues
        $recentIssues = Project::where(function ($query) {
            $query->where('health_status', '!=', 'online')
                ->orWhere('security_status', 'hacked')
                ->orWhere('security_status', 'compromised');
        })
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentIssues' => $recentIssues,
        ]);
    }
}
