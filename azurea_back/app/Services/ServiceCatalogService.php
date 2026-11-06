<?php

namespace App\Services;

use App\Models\Auberge;
use App\Models\Service;

class ServiceCatalogService
{
    public function getServices()
    {
        $service = Service::select('id', 'nom', 'description', 'prix_unitaire', 'actif')->paginate(10);
        return $service;
    }

    public function addService(Auberge $auberge, array $data)
    {
        $auberge->services()->create($data);
    }

    public function updateService(Service $service, array $data)
    {
        $service->update($data);
    }

    public function deleteService(Service $service)
    {
        $service->delete();
    }
}
