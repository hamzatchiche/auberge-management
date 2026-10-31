<?php

namespace App\Services;

use App\Models\Auberge;
use App\Models\Chambre;
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
    // gestion des services
    public function getServices(){

    }
    public function addService(Auberge $auberge,array $data){
        $auberge->services()->create($data);
    }
    public function updateService(){}
    public function deleteService(){}
}
