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
        Schema::create('chambre', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auberge_id')->constrained('auberge')->cascadeOnDelete();
            $table->string('numero');
            $table->string('type');
            $table->unsignedInteger('capacite');
            $table->decimal('prix_nuit',8,2);
            $table->string('status')->default('disponible');
            $table->timestamps();

            $table->unique(['auberge_id','numero']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chambre');
    }
};
