<?php

namespace App\Services;

use App\Enums\ModePaiement;
use App\Enums\StatutFacture;
use App\Enums\StatutReservation;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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
                'reservation.user:id,nom,prenom,email',
                'reservation.chambre:id,numero,type,prix_nuit',
                'lignesFacture:id,facture_id,description,quantite,prix_unitaire,sous_total',
                'paiement:id,facture_id,date_paiement,montant,mode_paiement',
            ])
            ->paginate(12);
    }

    public function getUserFactures(User $user)
    {
        return $user->reservation()
        
            ->with([
                'facture:id,reservation_id,numero,date_emission,montant_total,statut',
                'facture.lignesFacture:id,facture_id,description,quantite,prix_unitaire,sous_total',
                'facture.paiement:id,facture_id,date_paiement,montant,mode_paiement',
            ])
            ->get()
            ->pluck('facture')
            ->filter()
            ->values();
    }

    public function payefacture(Facture $facture)
    {
        return DB::transaction(function () use ($facture) {
            $facture = Facture::query()
                ->lockForUpdate()
                ->findOrFail($facture->id);

            if ($facture->statut === StatutFacture::Payee) {
                throw ValidationException::withMessages([
                    'message' => 'Cette facture est déjà payée.',
                ]);
            }

            $montant = (float) $facture->montant_total;

            if ($montant <= 0) {
                throw ValidationException::withMessages([
                    'facture' => 'Le montant de la facture doit être supérieur à zéro.',
                ]);
            }

            $facture->paiement()->create([
                'date_paiement' => now(),
                'montant' => $montant,
                'mode_paiement' => ModePaiement::Especes->value,
            ]);

            $facture->statut = StatutFacture::Payee;
            $facture->save();

            return $this->loadPaymentReceiptRelations($facture);
        }, attempts: 3);
    }

    public function getPaidInvoiceReceipt(Facture $facture): Facture
    {
        $facture = Facture::query()
            ->with($this->paymentReceiptRelations())
            ->findOrFail($facture->id);

        if (
            $facture->statut !== StatutFacture::Payee
            || $facture->paiement->isEmpty()
        ) {
            throw ValidationException::withMessages([
                'facture' => 'Aucun paiement confirmé n’est disponible pour cette facture.',
            ]);
        }

        return $facture;
    }

    private function loadPaymentReceiptRelations(Facture $facture): Facture
    {
        return $facture->load($this->paymentReceiptRelations());
    }

    private function paymentReceiptRelations(): array
    {
        return [
            'reservation.user:id,nom,prenom,email',
            'reservation.chambre:id,numero,type',
            'reservation.reservationServices.service',
            'lignesFacture',
            'paiement',
        ];
    }
}
