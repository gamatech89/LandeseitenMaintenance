<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Maintenance Report - {{ $project->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 30px;
        }
        .header {
            border-bottom: 2px solid #6c1e9f;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #6c1e9f;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #666;
            font-size: 14px;
        }
        .meta-row {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
        }
        .meta-item {
            display: table-cell;
            width: 25%;
        }
        .meta-label {
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
            display: block;
        }
        .meta-value {
            font-weight: bold;
            color: #333;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            color: #6c1e9f;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e0e0e0;
        }
        .content-box {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 5px;
            border-left: 3px solid #6c1e9f;
        }
        ul {
            margin: 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 5px;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-monthly { background: #e6f7ff; color: #1890ff; }
        .badge-weekly { background: #f6ffed; color: #52c41a; }
        .badge-adhoc { background: #fff7e6; color: #fa8c16; }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            font-size: 10px;
            color: #999;
            text-align: center;
        }
        .two-column {
            display: table;
            width: 100%;
        }
        .column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 10px;
        }
        .column:last-child {
            padding-right: 0;
            padding-left: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Maintenance Report</h1>
        <div class="subtitle">{{ $project->name }} @if($project->project_external_id)({{ $project->project_external_id }})@endif</div>
    </div>

    <div class="meta-row">
        <div class="meta-item">
            <span class="meta-label">Report Date</span>
            <span class="meta-value">{{ \Carbon\Carbon::parse($report->report_date)->format('F j, Y') }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Report Type</span>
            <span class="badge badge-{{ $report->type === 'ad-hoc' ? 'adhoc' : $report->type }}">
                {{ ucfirst(str_replace('-', ' ', $report->type)) }}
            </span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Author</span>
            <span class="meta-value">{{ $report->user->name ?? 'Unknown' }}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Time Spent</span>
            <span class="meta-value">
                @if($report->time_spent_minutes)
                    @php
                        $hours = floor($report->time_spent_minutes / 60);
                        $mins = $report->time_spent_minutes % 60;
                    @endphp
                    {{ $hours > 0 ? $hours . 'h ' : '' }}{{ $mins > 0 ? $mins . 'm' : ($hours > 0 ? '' : '0m') }}
                @else
                    Not tracked
                @endif
            </span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Summary</div>
        <div class="content-box">
            {{ $report->summary }}
        </div>
    </div>

    @if($report->tasks_completed && count($report->tasks_completed) > 0)
    <div class="section">
        <div class="section-title">✓ Tasks Completed</div>
        <div class="content-box">
            <ul>
                @foreach($report->tasks_completed as $task)
                    <li>{{ $task }}</li>
                @endforeach
            </ul>
        </div>
    </div>
    @endif

    @if($report->updates_performed && count($report->updates_performed) > 0)
    <div class="section">
        <div class="section-title">↑ Updates Performed</div>
        <div class="content-box">
            <ul>
                @foreach($report->updates_performed as $update)
                    <li>{{ is_array($update) ? ($update['name'] ?? $update) : $update }}</li>
                @endforeach
            </ul>
        </div>
    </div>
    @endif

    <div class="two-column">
        @if($report->issues_found && count($report->issues_found) > 0)
        <div class="column">
            <div class="section">
                <div class="section-title">⚠ Issues Found</div>
                <div class="content-box">
                    <ul>
                        @foreach($report->issues_found as $issue)
                            <li>{{ $issue }}</li>
                        @endforeach
                    </ul>
                </div>
            </div>
        </div>
        @endif

        @if($report->issues_resolved && count($report->issues_resolved) > 0)
        <div class="column">
            <div class="section">
                <div class="section-title">✓ Issues Resolved</div>
                <div class="content-box">
                    <ul>
                        @foreach($report->issues_resolved as $issue)
                            <li>{{ $issue }}</li>
                        @endforeach
                    </ul>
                </div>
            </div>
        </div>
        @endif
    </div>

    @if($report->notes)
    <div class="section">
        <div class="section-title">Additional Notes</div>
        <div class="content-box">
            {!! nl2br(e($report->notes)) !!}
        </div>
    </div>
    @endif

    <div class="footer">
        Generated on {{ now()->format('F j, Y \a\t g:i A') }} • LSM - Landeseiten Maintenance
    </div>
</body>
</html>
