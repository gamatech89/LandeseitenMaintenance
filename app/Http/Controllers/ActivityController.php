<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityController extends Controller
{
    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Activity::with(['causer', 'subject'])
            ->orderBy('created_at', 'desc');

        // Non-admins can only see activity on projects they have access to
        if (!$user->isAdmin()) {
            $accessibleProjectIds = $this->getAccessibleProjectIds($user);
            
            $query->where(function ($q) use ($accessibleProjectIds, $user) {
                // Activities on projects
                $q->where(function ($sub) use ($accessibleProjectIds) {
                    $sub->where('subject_type', 'App\\Models\\Project')
                        ->whereIn('subject_id', $accessibleProjectIds);
                })
                // Activities on credentials of accessible projects
                ->orWhere(function ($sub) use ($accessibleProjectIds) {
                    $sub->where('subject_type', 'App\\Models\\Credential')
                        ->whereHas('subject', function ($credQuery) use ($accessibleProjectIds) {
                            $credQuery->whereIn('project_id', $accessibleProjectIds);
                        });
                })
                // Activities caused by the user themselves
                ->orWhere('causer_id', $user->id);
            });
        }

        // Filter by description/event type
        if ($request->filled('event')) {
            $query->where('description', $request->event);
        }

        // Filter by subject type
        if ($request->filled('subject_type')) {
            $query->where('subject_type', 'App\\Models\\' . $request->subject_type);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Search in properties
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('properties', 'like', "%{$search}%");
            });
        }

        $activities = $query->paginate(25)->withQueryString();

        // Transform the data for the frontend
        $activities->getCollection()->transform(function ($activity) {
            return [
                'id' => $activity->id,
                'description' => $activity->description,
                'event' => $activity->event,
                'subject_type' => class_basename($activity->subject_type ?? ''),
                'subject_id' => $activity->subject_id,
                'subject_name' => $this->getSubjectName($activity),
                'causer_name' => $activity->causer?->name ?? 'System',
                'causer_email' => $activity->causer?->email,
                'properties' => $activity->properties,
                'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                'time_ago' => $activity->created_at->diffForHumans(),
            ];
        });

        // Get unique event types for filter dropdown
        $eventTypes = Activity::select('description')
            ->distinct()
            ->pluck('description')
            ->filter()
            ->values();

        return Inertia::render('Activity/Index', [
            'activities' => $activities,
            'eventTypes' => $eventTypes,
            'filters' => $request->only(['event', 'subject_type', 'from_date', 'to_date', 'search']),
        ]);
    }

    /**
     * Get the name of the subject for display.
     */
    private function getSubjectName($activity): ?string
    {
        if (!$activity->subject) {
            return $activity->properties['credential_title'] 
                ?? $activity->properties['project_name'] 
                ?? null;
        }

        return match (class_basename($activity->subject_type)) {
            'Project' => $activity->subject->name,
            'Credential' => $activity->subject->title,
            'User' => $activity->subject->name,
            'Todo' => $activity->subject->title,
            'Resource' => $activity->subject->title,
            default => null,
        };
    }

    /**
     * Get project IDs that the user has access to.
     */
    private function getAccessibleProjectIds($user): array
    {
        $projectIds = [];

        // Managers can access their managed projects
        if ($user->isManager()) {
            $projectIds = array_merge($projectIds, $user->managedProjects()->pluck('id')->toArray());
        }

        // Developers can access their assigned projects
        $projectIds = array_merge($projectIds, $user->developedProjects()->pluck('id')->toArray());

        return array_unique($projectIds);
    }
}
