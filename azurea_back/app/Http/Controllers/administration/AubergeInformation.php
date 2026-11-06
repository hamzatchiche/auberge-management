<?php

namespace App\Http\Controllers\administration;

use App\Http\Controllers\Controller;
use App\Models\Auberge;
use App\Services\AubergeInformationService;
use Illuminate\Http\Request;

class AubergeInformation extends Controller
{
    public function __construct(private AubergeInformationService $aubergeInformationService)
    {
    }

    public function getAubergeInfos()
    {
        return $this->aubergeInformationService->getAubergeInfos();
    }

    public function updateAubergeInfo(Request $request, Auberge $auberge)
    {
        $data = $request->validate([
            'nom' => ['sometimes', 'required', 'string'],
            'adresse' => ['sometimes', 'required', 'string'],
            'ville' => ['sometimes', 'required', 'string'],
            'telephone' => ['sometimes', 'required', 'string'],
            'description' => ['sometimes', 'required', 'string']
        ]);
        $this->aubergeInformationService->updateAubergeInfo($auberge, $data);
        return response()->json([
            'message' => 'auberge mis à jour avec succès.'
        ], 200);
    }
}
