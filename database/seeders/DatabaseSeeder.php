<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\Credential;
use App\Models\Resource;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Create Manager User
        User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'password' => bcrypt('password'),
            'role' => 'manager',
        ]);

        // Create Viewer User
        User::factory()->create([
            'name' => 'Viewer User',
            'email' => 'viewer@example.com',
            'password' => bcrypt('password'),
            'role' => 'viewer',
        ]);

        // Realistic project data
        $projects = [
            [
                'name' => 'Müller & Co Website',
                'url' => 'https://mueller-co.de',
                'client_email' => 'contact@mueller-co.de',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Main Company Website\n\n- E-commerce site\n- Updated monthly\n- Peak traffic on weekends',
            ],
            [
                'name' => 'Schmidt Consulting',
                'url' => 'https://schmidt-consulting.com',
                'client_email' => 'info@schmidt-consulting.com',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Business Consulting Website\n\n- Simple corporate site\n- Contact form integration',
            ],
            [
                'name' => 'Weber Online Shop',
                'url' => 'https://weber-shop.de',
                'client_email' => 'shop@weber-shop.de',
                'health_status' => 'online',
                'security_status' => 'monitoring',
                'notes' => '# WooCommerce Shop\n\n- Regular security scans\n- SSL certificate expires in 3 months',
            ],
            [
                'name' => 'Fischer Portfolio',
                'url' => 'https://fischer-portfolio.com',
                'client_email' => 'hello@fischer-portfolio.com',
                'health_status' => 'down_error',
                'security_status' => 'secure',
                'notes' => '# Photography Portfolio\n\n- 500 error since yesterday\n- Need to check server logs',
            ],
            [
                'name' => 'Becker AG Corporate',
                'url' => 'https://becker-ag.de',
                'client_email' => 'web@becker-ag.de',
                'health_status' => 'online',
                'security_status' => 'hacked',
                'notes' => '# URGENT: Site Compromised\n\n- Malware detected\n- Restore from backup ASAP\n- Update all plugins',
            ],
            [
                'name' => 'Hoffmann Legal',
                'url' => 'https://hoffmann-legal.com',
                'client_email' => 'office@hoffmann-legal.com',
                'health_status' => 'updating',
                'security_status' => 'secure',
                'notes' => '# Law Firm Website\n\n- Currently performing WordPress core update\n- Maintenance mode enabled',
            ],
            [
                'name' => 'Koch Restaurant',
                'url' => 'https://koch-restaurant.de',
                'client_email' => 'booking@koch-restaurant.de',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Restaurant & Booking Site\n\n- OpenTable integration\n- Weekly menu updates',
            ],
            [
                'name' => 'Bauer Landwirtschaft',
                'url' => 'https://bauer-farm.de',
                'client_email' => 'info@bauer-farm.de',
                'health_status' => 'online',
                'security_status' => 'compromised',
                'notes' => '# Farm Equipment Site\n\n- Suspicious login attempts detected\n- Investigating potential breach',
            ],
            [
                'name' => 'Klein Tech Blog',
                'url' => 'https://klein-tech.com',
                'client_email' => 'admin@klein-tech.com',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Technology Blog\n\n- High traffic site\n- CDN enabled',
            ],
            [
                'name' => 'Wolf Design Studio',
                'url' => 'https://wolf-design.de',
                'client_email' => 'studio@wolf-design.de',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Design Agency Portfolio\n\n- Custom WordPress theme\n- Elementor Pro license',
            ],
            [
                'name' => 'Schröder Medizin',
                'url' => 'https://schroeder-medizin.de',
                'client_email' => 'praxis@schroeder-medizin.de',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Medical Practice Website\n\n- GDPR compliant\n- Online appointment system',
            ],
            [
                'name' => 'Neumann Immobilien',
                'url' => 'https://neumann-immobilien.com',
                'client_email' => 'info@neumann-immobilien.com',
                'health_status' => 'online',
                'security_status' => 'monitoring',
                'notes' => '# Real Estate Agency\n\n- Property listing platform\n- IDX integration',
            ],
            [
                'name' => 'Zimmermann Auto',
                'url' => 'https://zimmermann-auto.de',
                'client_email' => 'service@zimmermann-auto.de',
                'health_status' => 'down_error',
                'security_status' => 'secure',
                'notes' => '# Auto Repair Shop\n\n- Database connection error\n- Server overload issue',
            ],
            [
                'name' => 'Braun Fashion',
                'url' => 'https://braun-fashion.com',
                'client_email' => 'shop@braun-fashion.com',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Fashion E-commerce\n\n- Payment gateway integrated\n- Seasonal sales campaigns',
            ],
            [
                'name' => 'Krüger Fitness',
                'url' => 'https://krueger-fitness.de',
                'client_email' => 'info@krueger-fitness.de',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Fitness Studio Website\n\n- Class booking system\n- Member portal',
            ],
            [
                'name' => 'Hartmann Architekten',
                'url' => 'https://hartmann-architekten.com',
                'client_email' => 'office@hartmann-architekten.com',
                'health_status' => 'online',
                'security_status' => 'hacked',
                'notes' => '# Architecture Firm\n\n- Site defaced\n- Emergency restore needed\n- Client notified',
            ],
            [
                'name' => 'Lange Bildung',
                'url' => 'https://lange-bildung.de',
                'client_email' => 'kontakt@lange-bildung.de',
                'health_status' => 'updating',
                'security_status' => 'secure',
                'notes' => '# Educational Platform\n\n- LMS integration\n- Scheduled maintenance',
            ],
            [
                'name' => 'Otto Handwerk',
                'url' => 'https://otto-handwerk.de',
                'client_email' => 'info@otto-handwerk.de',
                'health_status' => 'online',
                'security_status' => 'secure',
                'notes' => '# Craftsman Website\n\n- Portfolio gallery\n- Contact form',
            ],
            [
                'name' => 'Sommer Events',
                'url' => 'https://sommer-events.com',
                'client_email' => 'booking@sommer-events.com',
                'health_status' => 'online',
                'security_status' => 'monitoring',
                'notes' => '# Event Management\n\n- Ticket booking system\n- PayPal integration',
            ],
            [
                'name' => 'Winter Reisen',
                'url' => 'https://winter-reisen.de',
                'client_email' => 'travel@winter-reisen.de',
                'health_status' => 'online',
                'security_status' => 'compromised',
                'notes' => '# Travel Agency\n\n- Malicious redirects detected\n- Investigating origin\n- Quarantine mode',
            ],
        ];

        foreach ($projects as $projectData) {
            $project = Project::create($projectData);

            // Create 2-4 credentials per project
            $credentialTypes = ['ssh', 'ftp', 'db', 'wp_admin', 'api'];
            $numCredentials = rand(2, 4);
            
            for ($i = 0; $i < $numCredentials; $i++) {
                $type = $credentialTypes[array_rand($credentialTypes)];
                
                Credential::create([
                    'project_id' => $project->id,
                    'title' => ucfirst($type) . ' Access',
                    'type' => $type,
                    'username' => 'user_' . strtolower($project->name),
                    'password' => 'SecurePass' . rand(1000, 9999) . '!',
                    'url' => $type === 'wp_admin' ? $project->url . '/wp-admin' : $project->url,
                ]);
            }

            // Create 1-3 resources per project
            $resourceLinks = [
                ['title' => 'Figma Design', 'url' => 'https://figma.com/project-' . $project->id],
                ['title' => 'Hosting Panel', 'url' => 'https://hosting-provider.com/client-' . $project->id],
                ['title' => 'Google Analytics', 'url' => 'https://analytics.google.com/site-' . $project->id],
                ['title' => 'Project Documentation', 'url' => 'https://docs.internal/project-' . $project->id],
            ];

            $numResources = rand(1, 3);
            for ($i = 0; $i < $numResources; $i++) {
                $link = $resourceLinks[$i % count($resourceLinks)];
                
                Resource::create([
                    'project_id' => $project->id,
                    'title' => $link['title'],
                    'type' => 'link',
                    'url' => $link['url'],
                ]);
            }
        }
    }
}
