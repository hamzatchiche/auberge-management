<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneFacture extends Model
{
    protected $fillable=['facture_id','description','quantite','prix_unitaire','sous_total'];
    public function casts():array{
        return [
        'prix_unitaire'=>'decimal:2',
        'sous_total'=>'decimal:2'
        ];
    }
    public function facture():BelongsTo{
        return $this->belongsTo(Facture::class);
    }
}
