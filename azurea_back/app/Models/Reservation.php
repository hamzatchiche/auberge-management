<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    protected $fillable=['user_id','chambre_id','date_debut','date_fin','nombre_adultes','nombre_enfants','statut','prix_total'];
    public function user():BelongsTo{
        return $this->belongsTo(User::class);
    }
    public function chambre(): BelongsTo{
        return $this->belongsTo(Chambre::class);
    }

    public function reservationServices():HasMany{
        return $this->hasMany(ReservationService::class);
    }
    public function facture():HasOne{
        return $this->hasOne(Facture::class);
    }
}
