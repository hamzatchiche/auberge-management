<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationService extends Model
{
    protected $fillable=['reservation_id','service_id','quantite','prix_unitaire_applique'];
    public function reservation():BelongsTo{
        return $this->belongsTo(Reservation::class);
    }
    public function service():BelongsTo{
        return $this->belongsTo(Service::class);
    }
    public function sousTotal(): float
{
    return $this->quantite * (float) $this->prix_unitaire_applique;
}
}
