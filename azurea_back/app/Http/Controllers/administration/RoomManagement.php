<?php

namespace App\Http\Controllers\administration;

use App\Enums\StatutChambre;
use App\Http\Controllers\Controller;
use App\Models\Auberge;
use App\Models\Chambre;
use App\Services\RoomManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomManagement extends Controller
{
    public function __construct(private RoomManagementService $roomManagementService)
    {
    }

    public function createChambre(Request $request): JsonResponse
    {
        $data = $request->validate([
            'numero' => ['required', 'string', 'max:20'],
            'type' => ['required', 'string', 'max:50'],
            'capacite' => ['required', 'integer', 'min:1'],
            'prix_nuit' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', Rule::enum(StatutChambre::class)],
        ]);
        $auberge = Auberge::findOrFail(1);
        $this->roomManagementService->createChambre($auberge, $data);
        return response()->json([
            'message' => 'Chambre créée avec succès.'
        ], 201);
    }

    public function getChambres()
    {
        return $this->roomManagementService->getChambres();
    }

    public function updateChambre(Request $request, Chambre $chambre)
    {
        $data = $request->validate([
            'numero' => ['sometimes', 'string', 'max:20'],
            'type' => ['sometimes', 'string', 'max:50'],
            'capacite' => ['sometimes', 'integer', 'min:1'],
            'prix_nuit' => ['sometimes', 'numeric', 'min:0'],
        ]);
        $this->roomManagementService->updateChambre($chambre, $data);
        return response()->json([
            'message' => 'chambre mis à jour avec succès.'
        ], 200);
    }

    public function updateStatusChambre(Request $request, Chambre $chambre)
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(StatutChambre::class)]
        ]);
        $this->roomManagementService->updateStatusChambre($chambre, $data['status']);
        return response()->json([
            'message' => 'Statut de la chambre mis à jour.'
        ]);
    }

    public function deleteChambre(Chambre $chambre)
    {
        $this->roomManagementService->deleteChambre($chambre);
        return response()->json([
            'message' => 'chambre suprimmer avec succès .'
        ], 200);
    }

    public function getAvailablechambres(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date_debut' => ['required', 'date', 'after_or_equal:today'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'nombre_adultes' => ['required', 'integer', 'min:1'],
            'nombre_enfants' => ['required', 'integer', 'min:0'],
        ]);
        $chambres = $this->roomManagementService->getAvailablechambres($data);
        return response()->json([
            'message' => 'Liste des chambres disponibles.',
            'chambres' => $chambres,
        ]);
    }
}
