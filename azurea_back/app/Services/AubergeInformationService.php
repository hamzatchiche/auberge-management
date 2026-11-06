<?php

namespace App\Services;

use App\Models\Auberge;

class AubergeInformationService
{
    public function getAubergeInfos()
    {
        $auberge = Auberge::select('id', 'nom', 'adresse', 'ville', 'telephone', 'description')->get();
        return $auberge;
    }

    public function updateAubergeInfo(Auberge $auberge, array $data)
    {
        $auberge->update($data);
    }
}
