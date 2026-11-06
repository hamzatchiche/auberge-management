<?php

namespace App\Http\Controllers\administration;

use App\Http\Controllers\Controller;
use App\Models\Auberge;
use App\Models\Service;
use App\Services\ServiceCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceManagement extends Controller
{
    public function __construct(private ServiceCatalogService $serviceCatalogService)
    {
    }

    public function getServices()
    {
        return $this->serviceCatalogService->getServices();
    }

    public function addService(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => ['required', 'string'],
            'description' => ['required', 'string'],
            'prix_unitaire' => ['required', 'numeric', 'min:0'],
            'actif' => ['sometimes', 'boolean'],
        ]);
        $auberge = Auberge::findOrFail(1);
        $this->serviceCatalogService->addService($auberge, $data);
        return response()->json([
            'message' => 'service crée avec succès .'
        ], 200);
    }

    public function updateService(Request $request, Service $service)
    {
        $data = $request->validate([
            'nom' => ['sometimes', 'string'],
            'description' => ['sometimes', 'string'],
            'prix_unitaire' => ['sometimes', 'numeric', 'min:0'],
            'actif' => ['sometimes', 'boolean'],
        ]);
        $this->serviceCatalogService->updateService($service, $data);
        return response()->json([
            'message' => 'service mise à jour avec succès'
        ], 200);
    }

    public function deleteService(Service $service)
    {
        $this->serviceCatalogService->deleteService($service);
        return response()->json([
            'message' => 'service suprimmer avec succès .'
        ], 200);
    }
}
