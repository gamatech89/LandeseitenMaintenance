<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url');
            $table->string('client_email')->nullable();
            $table->text('notes')->nullable(); // Markdown notes
            $table->enum('health_status', ['online', 'down_error', 'updating'])->default('online');
            $table->enum('security_status', ['secure', 'monitoring', 'compromised', 'hacked'])->default('secure');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
