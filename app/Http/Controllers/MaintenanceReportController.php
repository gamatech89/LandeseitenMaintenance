<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceReport;
use App\Models\Project;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class MaintenanceReportController extends Controller
{
    /**
     * Store a new maintenance report for a project.
     */
    public function store(Request $request, Project $project)
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'report_date' => 'required|date',
            'type' => 'required|in:monthly,weekly,ad-hoc',
            'summary' => 'required|string|max:1000',
            'tasks_completed' => 'nullable|array',
            'tasks_completed.*' => 'string|max:500',
            'updates_performed' => 'nullable|array',
            'updates_performed.*' => 'string|max:500',
            'issues_found' => 'nullable|array',
            'issues_found.*' => 'string|max:500',
            'issues_resolved' => 'nullable|array',
            'issues_resolved.*' => 'string|max:500',
            'notes' => 'nullable|string|max:2000',
            'time_spent_minutes' => 'nullable|integer|min:0|max:1440',
        ]);

        $validated['project_id'] = $project->id;
        $validated['user_id'] = Auth::id();

        // Filter out empty arrays
        foreach (['tasks_completed', 'updates_performed', 'issues_found', 'issues_resolved'] as $field) {
            if (isset($validated[$field])) {
                $filtered = array_filter($validated[$field], fn($item) => is_string($item) && trim($item) !== '');
                $validated[$field] = !empty($filtered) ? array_values($filtered) : null;
            }
        }

        $report = MaintenanceReport::create($validated);

        return back()->with('success', 'Maintenance report added successfully.');
    }

    /**
     * Update an existing maintenance report.
     */
    public function update(Request $request, Project $project, MaintenanceReport $report)
    {
        Gate::authorize('update', $project);

        // Ensure report belongs to this project
        if ($report->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'report_date' => 'required|date',
            'type' => 'required|in:monthly,weekly,ad-hoc',
            'summary' => 'required|string|max:1000',
            'tasks_completed' => 'nullable|array',
            'tasks_completed.*' => 'string|max:500',
            'updates_performed' => 'nullable|array',
            'updates_performed.*' => 'string|max:500',
            'issues_found' => 'nullable|array',
            'issues_found.*' => 'string|max:500',
            'issues_resolved' => 'nullable|array',
            'issues_resolved.*' => 'string|max:500',
            'notes' => 'nullable|string|max:2000',
            'time_spent_minutes' => 'nullable|integer|min:0|max:1440',
        ]);

        // Filter out empty arrays
        foreach (['tasks_completed', 'updates_performed', 'issues_found', 'issues_resolved'] as $field) {
            if (isset($validated[$field])) {
                $filtered = array_filter($validated[$field], fn($item) => is_string($item) && trim($item) !== '');
                $validated[$field] = !empty($filtered) ? array_values($filtered) : null;
            }
        }

        $report->update($validated);

        return back()->with('success', 'Maintenance report updated successfully.');
    }

    /**
     * Delete a maintenance report.
     */
    public function destroy(Project $project, MaintenanceReport $report)
    {
        Gate::authorize('update', $project);

        // Ensure report belongs to this project
        if ($report->project_id !== $project->id) {
            abort(404);
        }

        $report->delete();

        return back()->with('success', 'Maintenance report deleted successfully.');
    }

    /**
     * Download a maintenance report as PDF.
     */
    public function downloadPdf(Project $project, MaintenanceReport $report)
    {
        Gate::authorize('view', $project);

        // Ensure report belongs to this project
        if ($report->project_id !== $project->id) {
            abort(404);
        }

        $report->load('user');

        $pdf = Pdf::loadView('pdf.maintenance-report', [
            'report' => $report,
            'project' => $project,
        ]);

        $filename = sprintf(
            'maintenance-report-%s-%s.pdf',
            $project->project_external_id ?? $project->id,
            $report->report_date->format('Y-m-d')
        );

        return $pdf->download($filename);
    }

    /**
     * Get task suggestions for autocomplete.
     */
    public function suggestions(Request $request)
    {
        $search = $request->get('q', '');
        $field = $request->get('field', 'tasks_completed');
        
        // Allowed fields for suggestions
        $allowedFields = ['tasks_completed', 'updates_performed', 'issues_found', 'issues_resolved'];
        if (!in_array($field, $allowedFields)) {
            return response()->json([]);
        }

        // Get all unique values from all reports for this field
        $suggestions = MaintenanceReport::whereNotNull($field)
            ->pluck($field)
            ->flatten()
            ->filter(fn($item) => is_string($item) && !empty(trim($item)))
            ->unique()
            ->values();

        // Filter by search term if provided
        if ($search) {
            $searchLower = strtolower($search);
            $suggestions = $suggestions->filter(function ($item) use ($searchLower) {
                return str_contains(strtolower($item), $searchLower);
            })->values();
        }

        // Sort by relevance (items starting with search term first)
        if ($search) {
            $suggestions = $suggestions->sort(function ($a, $b) use ($searchLower) {
                $aStarts = str_starts_with(strtolower($a), $searchLower);
                $bStarts = str_starts_with(strtolower($b), $searchLower);
                if ($aStarts && !$bStarts) return -1;
                if (!$aStarts && $bStarts) return 1;
                return strcasecmp($a, $b);
            })->values();
        }

        return response()->json($suggestions->take(10));
    }
}
