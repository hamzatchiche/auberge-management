<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Auberge extends Model
{
   protected $table='auberge';
    protected  $fillable=['nom','adresse','ville','telephone','description'];

    public function chambres():HasMany{
        return $this->hasMany(Chambre::class);
    }
    public function services(){
        return $this->hasMany(Service::class);
    }
}
