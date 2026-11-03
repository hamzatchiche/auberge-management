<?php

namespace App\Services;

use App\Enums\StatutChambre;
use App\Enums\StatutReservation;
use App\Models\Auberge;
use App\Models\Chambre;
use App\Models\Service;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\JsonResponse;

class AubergeManagementService
{   
    // gest auberge
    public function getAubergeInfos(){
        $auberge=Auberge::select('id','nom','adresse','ville','telephone','description')->get();
        return $auberge;
    }
    public function updateAubergeInfo(Auberge $auberge,array $data){
       $auberge->update($data);
    }
    // gestion des chambres
    public function createChambre(Auberge $auberge,array $data){
    $auberge->chambres()->create($data);
    }
    public function getChambres(){
        $chambre=Chambre::select('id','numero','type','capacite','prix_nuit','status')->paginate(15);
        return $chambre;
    }
    public function updateChambre(Chambre $chambre,array $data){
        $chambre->update($data);
    }
    public function deleteChambre(Chambre $chambre){
        $chambre->delete();
    }
    public function getAvailablechambres(array $data){
        $nombrePersonnes=$data['nombre_adultes']+$data['nombre_enfants'];
        return Chambre::query()
        ->where('capacite','>=',$nombrePersonnes)

        ->whereNotIn('status',[
            StatutChambre::EnMaintenance->value,
            StatutChambre::EnNettoyage->value,
        ])
        ->whereDoesntHave('reservations',function($query) use ($data){
            $query->whereIn('statut',[
                StatutReservation::Confirmee->value,
                StatutReservation::EnCours->value,
            ])
            ->where('date_debut','<',$data['date_fin'])
            ->where('date_fin','>' ,$data['date_debut']);
        })
        ->select([
            'id',
            'auberge_id',
            'numero',
            'type',
            'capacite',
            'prix_nuit',
            'status',
        ])
        ->get();
    }
    // gestion des services
    public function getServices(){
        $service=Service::select('id','nom','description','prix_unitaire','actif')->paginate(10);
        return $service;
    }
    public function addService(Auberge $auberge,array $data){
        $auberge->services()->create($data);
    }
    public function updateService(Service $service,array $data){
        $service->update($data);
    }
    public function deleteService(Service $service){
        $service->delete();
    }
}
