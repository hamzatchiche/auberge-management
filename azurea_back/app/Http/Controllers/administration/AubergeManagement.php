<?php

namespace App\Http\Controllers\administration;

use App\Enums\StatutChambre;
use App\Http\Controllers\Controller;
use App\Models\Auberge;
use App\Models\Chambre;
use App\Services\AubergeManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AubergeManagement extends Controller
{
    public function __construct(private AubergeManagementService $aubergeManagementService)
    {
    }
    public function getAubergeInfos()
    {

        return $this->aubergeManagementService->getAubergeInfos();
    }
    public function updateAubergeInfo(Request $request,Auberge $auberge)
    {
        $data = $request->validate([
            'nom' => ['sometimes', 'required', 'string'],
            'adresse' => ['sometimes', 'required', 'string'],
            'ville' => ['sometimes', 'required', 'string'],
            'telephone' => ['sometimes', 'required', 'string'],
            'description' => ['sometimes', 'required', 'string']
        ]);
        $this->aubergeManagementService->updateAubergeInfo($auberge, $data);
        return response()->json([
            'message' => 'auberge mis à jour avec succès.'
        ], 200);
    }
    public function createChambre(Request $request):JsonResponse{
    $data = $request->validate([
        'numero' => ['required', 'string', 'max:20'],
        'type' => ['required', 'string', 'max:50'],
        'capacite' => ['required', 'integer', 'min:1'],
        'prix_nuit' => ['required', 'numeric', 'min:0'],
        'status' => ['sometimes','required' ,Rule::enum(StatutChambre::class)],
    ]);
    $auberge=Auberge::findOrFail(1);
    $this->aubergeManagementService->createChambre($auberge,$data);
     return response()->json([
        'message' => 'Chambre créée avec succès.'
    ], 201);
    }
    public function getChambres(){
        return $this->aubergeManagementService->getChambres();
    }
    public function updateChambre(Request $request,Chambre $chambre){
    $data = $request->validate([
        'numero' => ['sometimes', 'string', 'max:20'],
        'type' => ['sometimes', 'string', 'max:50'],
        'capacite' => ['sometimes', 'integer', 'min:1'],
        'prix_nuit' => ['sometimes', 'numeric', 'min:0'],
        'status' => ['sometimes' ,Rule::enum(StatutChambre::class)],
    ]);
    $this->aubergeManagementService->updateChambre($chambre,$data);
     return response()->json([
            'message' => 'chambre mis à jour avec succès.'
        ], 200);
    }
    public function deleteChambre(Chambre $chambre){
        $this->aubergeManagementService->deleteChambre($chambre);
        return response()->json([
            'message'=>'chambre suprimmer avec succès .'
        ],200);
    }
    public function getServices(){}
    public function addService(Request $request):JsonResponse{
        $data=$request->validate([
             'nom' => ['required', 'string'],
        'description' => ['required', 'string'],
        'prix_unitaire' => ['required', 'numeric', 'min:0'],
        'actif' => ['required', 'boolean'],
        ]);
        $auberge=Auberge::findOrFail(1);
        $this->aubergeManagementService->addService($auberge,$data);
        return response()->json([
            'message'=>'service crée avec succès .'
        ],201);
    }
    public function updateService(){}
    public function deleteService(){}
}
