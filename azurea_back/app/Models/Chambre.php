<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chambre extends Model
{
    protected $table='chambre';

    protected $fillable=['auberge_id','numero','type','capacite','prix_nuit','status'];
    public function auberge():BelongsTo{
        return $this->belongsTo(Auberge::class);
    }
    public function reservations():HasMany{
        return $this->hasMany(Reservation::class);
    }
}
