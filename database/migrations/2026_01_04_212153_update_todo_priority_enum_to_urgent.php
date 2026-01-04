<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite doesn't support altering enums easily.
        // We'll recreate the column with the new enum values.
        Schema::table('todos', function (Blueprint $table) {
            $table->enum('priority_new', ['low', 'medium', 'high', 'urgent'])->default('medium');
        });

        // Copy data from old column to new column, converting 'critical' to 'urgent'
        // and ensuring all values are valid for the new enum
        DB::statement("UPDATE todos SET priority_new = CASE 
            WHEN priority = 'critical' THEN 'urgent' 
            WHEN priority IN ('low', 'medium', 'high') THEN priority
            ELSE 'medium' 
            END");

        // Drop old column and rename new column
        Schema::table('todos', function (Blueprint $table) {
            $table->dropColumn('priority');
        });

        Schema::table('todos', function (Blueprint $table) {
            $table->renameColumn('priority_new', 'priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the migration by changing 'urgent' back to 'critical'
        Schema::table('todos', function (Blueprint $table) {
            $table->enum('priority_old', ['low', 'medium', 'high', 'critical'])->default('medium');
        });

        // Copy data from new column to old column, converting 'urgent' to 'critical'
        // and ensuring all values are valid for the old enum
        DB::statement("UPDATE todos SET priority_old = CASE 
            WHEN priority = 'urgent' THEN 'critical' 
            WHEN priority IN ('low', 'medium', 'high') THEN priority
            ELSE 'medium' 
            END");

        // Drop new column and rename old column back
        Schema::table('todos', function (Blueprint $table) {
            $table->dropColumn('priority');
        });

        Schema::table('todos', function (Blueprint $table) {
            $table->renameColumn('priority_old', 'priority');
        });
    }
};
