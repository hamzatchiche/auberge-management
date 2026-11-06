<?php

namespace App\Services;

use App\Enums\StatutFacture;
use App\Enums\StatutReservation;
use App\Models\Facture;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class InvoiceManagementService
{
    public function getFactures()
    {
        return Facture::whereHas('reservation', function ($query) {
            $query->where('statut', '!=', StatutReservation::Annulee->value);
        })
            ->with([
                'reservation:id,user_id,chambre_id,date_debut,date_fin,statut,prix_total',
                'reservation.user:id,nom,prenom',
                'reservation.chambre:id,numero,type',
                'lignesFacture:id,facture_id,description,quantite,prix_unitaire,sous_total',
            ])
            ->paginate(12);
    }

    public function getUserFactures(User $user)
    {
        return $user->reservation()
            ->with([
                'facture:id,reservation_id,numero,date_emission,montant_total,statut',
                'facture.lignesFacture:id,facture_id,description,quantite,prix_unitaire,sous_total',
            ])
            ->get()
            ->pluck('facture')
            ->filter()
            ->values();
    }

    public function payefacture(Facture $facture)
    {
        if ($facture->statut == StatutFacture::Payee) {
            throw ValidationException::withMessages(
                ['message' => 'cette facture est déja payée']
            );
        }
        ;
        $facture->statut = StatutFacture::Payee;
        $facture->save();
    }
}
