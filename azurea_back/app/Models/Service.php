<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable=['auberge_id','nom','description','prix_unitaire','actif'];
    public function auberge(){
        return $this->belongsTo(Auberge::class);
    }
    public function reservationServices():HasMany{
        return $this->hasMany(ReservationService::class);
    }
}
