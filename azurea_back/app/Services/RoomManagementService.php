<?php

namespace App\Services;

use App\Enums\StatutChambre;
use App\Enums\StatutReservation;
use App\Models\Auberge;
use App\Models\Chambre;
use Illuminate\Validation\ValidationException;

class RoomManagementService
{
    public function createChambre(Auberge $auberge, array $data)
    {
        $auberge->chambres()->create($data);
    }

    public function getChambres()
    {
        $chambre = Chambre::select('id', 'numero', 'type', 'capacite', 'prix_nuit', 'status')->paginate(15);
        return $chambre;
    }

    public function updateChambre(Chambre $chambre, array $data)
    {
        $chambre->update($data);
    }

    public function updateStatusChambre(Chambre $chambre, string $status)
    {
        if ($chambre->status === StatutChambre::Occupee) {
            throw ValidationException::withMessages([
                'status' => 'Impossible de libérer une chambre occupée.',
            ]);
        }
        $chambre->status = $status;
        $chambre->save();
    }

    public function deleteChambre(Chambre $chambre)
    {
        $chambre->delete();
    }

    public function getAvailablechambres(array $data)
    {
        $nombrePersonnes = $data['nombre_adultes'] + $data['nombre_enfants'];
        return Chambre::query()
            ->where('capacite', '>=', $nombrePersonnes)
            ->whereNotIn('status', [
                StatutChambre::EnMaintenance->value,
                StatutChambre::EnNettoyage->value,
            ])
            ->whereDoesntHave('reservations', function ($query) use ($data) {
                $query->whereIn('statut', [
                    StatutReservation::Confirmee->value,
                    StatutReservation::EnCours->value,
                ])
                    ->where('date_debut', '<', $data['date_fin'])
                    ->where('date_fin', '>', $data['date_debut']);
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
}
