<?php

namespace App\Models;

use App\Enums\StatutFacture;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    protected $fillable=['reservation_id','numero','date_emission','montant_total','statut'];
    public function casts():array{
        return [
            'date_emission'=>'date',
            'montant_total'=>'decimal:2',
            'statut'=> StatutFacture::class,
        ];
    }

    public function reservation():BelongsTo{
        return $this->belongsTo(Reservation::class);
    }
    public function paiement():HasMany{
        return $this->hasMany(Paiement::class);
    }
    public function lignesfacture():HasMany{
        return $this->hasMany(LigneFacture::class);
    }
}
