<?php

namespace App\Services;

use App\Enums\Role;
use App\Enums\StatutChambre;
use App\Enums\StatutFacture;
use App\Enums\StatutReservation;
use App\Models\Chambre;
use App\Models\Facture;
use App\Models\LigneFacture;
use App\Models\Reservation;
use App\Models\ReservationService;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;


class ReservationManagementService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
    }
    public function createreservation(
        Chambre $chambre,
        User $user,
        array $data
    ): Reservation {

        return DB::transaction(function () use ($chambre, $user, $data) {

            // Verrouiller la chambre
            $chambre = Chambre::query()
                ->lockForUpdate()
                ->findOrFail($chambre->id);

            // Vérifier la capacité
            $nombrePersonnes = $data['nombre_adultes']
                + $data['nombre_enfants'];

            if ($chambre->capacite < $nombrePersonnes) {
                throw ValidationException::withMessages([
                    'chambre' => 'La capacité de cette chambre est insuffisante.',
                ]);
            }

            //  Vérifier l'état de la chambre
            if (
                in_array($chambre->status, [
                    StatutChambre::EnMaintenance,
                    StatutChambre::EnNettoyage,
                ], true)
            ) {
                throw ValidationException::withMessages([
                    'chambre' => 'Cette chambre est momentanément indisponible.',
                ]);
            }

            // Vérifier le chevauchement des réservations
            $hasConflict = $chambre->reservations()
                ->whereIn('statut', [
                    StatutReservation::Confirmee->value,
                    StatutReservation::EnCours->value,
                ])
                ->where('date_debut', '<', $data['date_fin'])
                ->where('date_fin', '>', $data['date_debut'])
                ->exists();

            if ($hasConflict) {
                throw ValidationException::withMessages([
                    'chambre' => 'Cette chambre vient d’être réservée pour cette période.',
                ]);
            }

            // Calculer le nombre de nuits
            $nombreNuits = Carbon::parse($data['date_debut'])
                ->diffInDays(Carbon::parse($data['date_fin']));

            // Calculer le prix de la chambre
            $prixChambre = (float) $chambre->prix_nuit * $nombreNuits;

            // Créer la réservation
            $reservation = $chambre->reservations()->create([
                'user_id' => $user->id,
                'date_debut' => $data['date_debut'],
                'date_fin' => $data['date_fin'],
                'nombre_adultes' => $data['nombre_adultes'],
                'nombre_enfants' => $data['nombre_enfants'],
                'statut' => StatutReservation::Confirmee->value,
                'prix_total' => $prixChambre,
            ]);

            // Préparer la ligne de facture de la chambre
            $lignesFacture = [
                [
                    'description' => 'Chambre ' . $chambre->numero
                        . ' - ' . $nombreNuits . ' nuit(s)',
                    'quantite' => $nombreNuits,
                    'prix_unitaire' => (float) $chambre->prix_nuit,
                    'sous_total' => $prixChambre,
                ],
            ];

            // Ajouter les services sélectionnés
            $prixServices = 0;

            foreach ($data['services'] ?? [] as $serviceData) {

                $service = Service::query()
                    ->where('id', $serviceData['service_id'])
                    ->where('actif', true)
                    ->first();

                if (!$service) {
                    throw ValidationException::withMessages([
                        'services' => 'Un service sélectionné est inexistant ou inactif.',
                    ]);
                }

                $quantite = (int) $serviceData['quantite'];
                $prixUnitaire = (float) $service->prix_unitaire;
                $sousTotal = $quantite * $prixUnitaire;

                // Créer le lien Reservation-Service
                ReservationService::create([
                    'reservation_id' => $reservation->id,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_applique' => $prixUnitaire,
                ]);

                //Ajouter le service à la facture
                $lignesFacture[] = [
                    'description' => $service->nom,
                    'quantite' => $quantite,
                    'prix_unitaire' => $prixUnitaire,
                    'sous_total' => $sousTotal,
                ];

                $prixServices += $sousTotal;
            }

            // Calculer le total chambre + services
            $prixTotal = $prixChambre + $prixServices;

            // Mettre à jour le total de la réservation
            $reservation->update([
                'prix_total' => $prixTotal,
            ]);

            //Créer la facture
            $facture = Facture::create([
                'reservation_id' => $reservation->id,
                'numero' => 'TEMP-' . $reservation->id,
                'date_emission' => now(),
                'montant_total' => $prixTotal,
                'statut' => StatutFacture::NonPayee->value,
            ]);

            // Générer le numéro définitif
            $facture->update([
                'numero' => 'FAC-' . now()->format('Ymd') . '-' . $facture->id,
            ]);

            // Créer toutes les lignes de facture
            foreach ($lignesFacture as $ligne) {
                LigneFacture::create([
                    'facture_id' => $facture->id,
                    'description' => $ligne['description'],
                    'quantite' => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                    'sous_total' => $ligne['sous_total'],
                ]);
            }

            // Retourner la réservation with relations
            return $reservation->load([
                'chambre',
                'reservationServices.service',
                'facture.lignesFacture',
            ]);

        }, attempts: 3);
    }
    public function getUserReservations(User $user)
    {

        return $user->reservation()
            ->select([
                'id',
                'user_id',
                'chambre_id',
                'date_debut',
                'date_fin',
                'statut',
                'prix_total',
            ])
            ->with([
                'user:id,nom,prenom',
                'chambre:id,numero,type,prix_nuit'
            ])
            ->paginate(5);
    }
    public function getReservationById(Reservation $reservation)
    {
       return $reservation->load([
        'user:id,nom,prenom',
        'chambre:id,numero,type,prix_nuit',

        'reservationServices:id,reservation_id,service_id,quantite,prix_unitaire_applique',

        'reservationServices.service:id,nom,description,prix_unitaire'
       ]);
    }
    public function getUserReservation(User $user, int $reservationId)
    {

        return $user->reservation()
            ->select([
                'id',
                'user_id',
                'chambre_id',
                'date_debut',
                'date_fin',
                'nombre_adultes',
                'nombre_enfants',
                'statut',
                'prix_total',
            ])
            ->with([
                'user:id,nom,prenom',
                'chambre:id,numero,type,prix_nuit',
                'reservationServices:id,reservation_id,service_id,quantite,prix_unitaire_applique',
                'reservationServices.service:id,nom,description,prix_unitaire',
                'facture:id,reservation_id,numero,date_emission,montant_total,statut',
                'facture.lignesFacture:id,facture_id,description,quantite,prix_unitaire,sous_total',
            ])
            ->findOrFail($reservationId);
    }
    public function cancelReservation(Reservation $reservation, User $user)
    {
        return DB::transaction(function () use ($reservation, $user) {
            $reservation = Reservation::where('id', $reservation->id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($reservation->user_id != $user->id) {
                abort(403, 'Vous ne pouvez pas annuler cette réservation.');
            }
            if ($reservation->statut !== StatutReservation::Confirmee) {
                throw ValidationException::withMessages([
                    'reservation' => 'Cette réservation ne peut pas être annulée.'
                ]);
            }
            $datelimite = Carbon::parse($reservation->created_at)->addHours(24);
            if (now()->greaterThan($datelimite)) {
                throw ValidationException::withMessages([
                    'date_debut' => 'L’annulation doit être effectuée au plus 24 heures après la réservation.'
                ]);
            }
            $reservation->statut = StatutReservation::Annulee;
            $reservation->save();
        });
    }
    public function addServicetoReservation(Reservation $reservation, User $user, array $data)
    {
        return DB::transaction(function () use ($reservation, $user, $data) {
            $reservation = Reservation::where('id', $reservation->id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($reservation->user_id != $user->id) {
                abort(403, 'Vous ne pouvez pas modifier cette réservation.');
            };
            if ($reservation->statut === StatutReservation::Annulee) {
                throw ValidationException::withMessages([
                    'reservation' => 'Impossible d’ajouter des services à une réservation annulée.',
                ]);
            }
            $facture = Facture::where('reservation_id', $reservation->id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($facture->statut === StatutFacture::Payee) {
                throw ValidationException::withMessages([
                    'facture' => 'Cette facture est déjà payée.',
                ]);
            }
            $prixServices = 0;

            foreach ($data['services'] as $serviceData) {

                $service = Service::query()
                    ->where('id', $serviceData['service_id'])
                    ->where('actif', true)
                    ->first();

                if (!$service) {
                    throw ValidationException::withMessages([
                        'services' => 'Un service sélectionné est inexistant ou inactif.',
                    ]);
                }

                $quantite = (int) $serviceData['quantite'];
                $prixUnitaire = (float) $service->prix_unitaire;
                $sousTotal = $quantite * $prixUnitaire;

                // Créer le lien Reservation-Service
                ReservationService::create([
                    'reservation_id' => $reservation->id,
                    'service_id' => $service->id,
                    'quantite' => $quantite,
                    'prix_unitaire_applique' => $prixUnitaire,
                ]);

                //Ajouter le service à la facture
                LigneFacture::create([
                    'facture_id' => $facture->id,
                    'description' => $service->nom,
                    'quantite' => $quantite,
                    'prix_unitaire' => $prixUnitaire,
                    'sous_total' => $sousTotal,
                ]);

                $prixServices += $sousTotal;
            }
            $facture->montant_total += $prixServices;
            $facture->save();
            $reservation->prix_total += $prixServices;
            $reservation->save();
            return $reservation->load([
                'chambre',
                'reservationServices.service',
                'facture.lignesFacture',
            ]);
        });
    }
    public function getAllReservations(array $filters){
        return Reservation::query()
            ->select([
                'id',
                'user_id',
                'chambre_id',
                'date_debut',
                'date_fin',
                'nombre_adultes',
                'nombre_enfants',
                'statut',
                'prix_total',
            ])
         ->with([
            'user:id,nom,prenom',
            'chambre:id,numero,type',
        ])
        ->when(isset($filters['dateDebut']), function ($query) use ($filters){
            $query->whereDate('date_debut', $filters['dateDebut']);
        })
        ->when(isset($filters['dateFin']), function ($query) use ($filters) {
            $query->whereDate('date_fin', $filters['dateFin']);
        })

        ->when(isset($filters['statut']), function ($query) use ($filters) {
            $query->where('statut', $filters['statut']);
        })
        ->when(isset($filters['client']), function ($query) use ($filters) {
            $client=$filters['client'];
            $query->whereHas('user',function ($q) use ($client){
                $q->where('nom', 'like', "%{$client}%")
                    ->orWhere('prenom', 'like', "%{$client}%")
                    ->orWhere('email', 'like', "%{$client}%");
            });
        })
        ->when(isset($filters['numero']), function ($query) use ($filters) {
            $numero = $filters['numero'];

            $query->whereHas('chambre', function ($q) use ($numero) {
                $q->where('numero', '=', "$numero");
            });
        })
        ->latest()
        ->paginate(10);
            
    }

}
