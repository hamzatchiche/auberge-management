<?php

namespace App\Models;

use App\Enums\ModePaiement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    protected $fillable=['facture_id','date_paiement','montant','mode_paiement'];

    public function casts(): array{
        return [
            'date_paiement'=>'datetime',
            'montant'=>'decimal:2',
            'mode_paiement'=>ModePaiement::class
        ];
    }
    public function facture():BelongsTo{
        return $this->belongsTo(Facture::class);
    }
}
