<?php

namespace App\Models;

use App\Enums\Enums\StatutFacture;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    private $fillable=['reservation_id','numero','date_emission','montant_total','statut'];
    public function casts():array{
        return [
            'date_emission'=>'date',
            'montant_total'=>'decimal:2',
            'status'=>StatutFacture::class,
        ];
    }

    public function reservation():BelongsTo{
        return $this->belongsTo(Reservation::class);
    }
    public function paiement():HasMany{
        return $this->hasMany(Paiement::class);
    }
    public function lignefacture():HasMany{
        return $this->hasMany(LigneFacture::class);
    }
}
