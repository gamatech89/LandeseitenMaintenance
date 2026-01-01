<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| Health checks run 3 times per day: 8:00, 14:00, and 20:00
| Uses --deep flag to check WordPress plugin health data where available
|
*/

Schedule::command('projects:health-check --deep --notify')
    ->dailyAt('08:00')
    ->timezone('Europe/Berlin')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('projects:health-check --deep --notify')
    ->dailyAt('14:00')
    ->timezone('Europe/Berlin')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('projects:health-check --deep --notify')
    ->dailyAt('20:00')
    ->timezone('Europe/Berlin')
    ->withoutOverlapping()
    ->runInBackground();
