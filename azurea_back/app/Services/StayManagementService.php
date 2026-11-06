<?php

namespace App\Services;

use App\Enums\StatutChambre;
use App\Enums\StatutReservation;
use App\Models\Chambre;
use App\Models\Reservation;
use DB;
use Illuminate\Validation\ValidationException;

class StayManagementService
{
    public function CheckIn(Reservation $reservation)
    {
        return DB::transaction(function () use ($reservation) {
            $reservation = Reservation::where('id', $reservation->id)
                ->lockForUpdate()
                ->firstOrFail();
            $chambre = Chambre::where('id', $reservation->chambre_id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($reservation->statut === StatutReservation::Annulee) {
                throw ValidationException::withMessages(
                    [
                        'message' => 'cette reservation est déja annulée.'
                    ]
                );
            };
            if ($reservation->check_in != null) {
                throw ValidationException::withMessages([
                    'message' => 'ce client déja fait le check In'
                ]);
            }
            if ($reservation->date_debut > now()) {
                throw ValidationException::withMessages([
                    'message' => 'le temps de check in n\'est pas encore arrivé'
                ]);
            }
            $reservation->check_in = now();
            $reservation->statut = StatutReservation::EnCours;
            $reservation->save();

            $chambre->status = StatutChambre::Occupee;
            $chambre->save();
        });
    }

    public function getCheckIntoday()
    {
        $reservation = Reservation::query()
            ->where('date_debut', today())
            ->whereNot('statut', StatutReservation::Annulee)
            ->select([
                'id',
                'user_id',
                'chambre_id',
                'date_debut',
                'date_fin',
            ])
            ->with([
                'user:id,nom,prenom',
                'chambre:id,numero'
            ])
            ->get();

        return $reservation;
    }

    public function CheckOut(Reservation $reservation)
    {
        $reservation = Reservation::where('id', $reservation->id)
            ->lockForUpdate()
            ->firstOrFail();
        $chambre = Chambre::where('id', $reservation->chambre_id)
            ->lockForUpdate()
            ->firstOrFail();
        if ($reservation->statut !== StatutReservation::EnCours) {
            throw ValidationException::withMessages([
                'reservation' => 'Cette réservation n’est pas en cours.',
            ]);
        }
        if ($reservation->check_out != null) {
            throw ValidationException::withMessages([
                'message' => 'ce client à déja fais le check out'
            ]);
        }
        if ($reservation->check_in === null) {
            throw ValidationException::withMessages([
                'message' => 'ce client n\'est pas encore fais le checkIn'
            ]);
        }
        $reservation->check_out = now();
        $reservation->statut = StatutReservation::Terminee;
        $reservation->save();

        $chambre->status = StatutChambre::EnNettoyage;
        $chambre->save();
    }

    public function getCheckOuttoday()
    {
        $reservation = Reservation::query()
            ->where([['date_fin', '=', today()], ['statut', '=', StatutReservation::EnCours]])
            ->select([
                'id',
                'user_id',
                'chambre_id',
                'date_debut',
                'date_fin',
                'prix_total'
            ])
            ->with([
                'user:id,nom,prenom',
                'chambre:id,numero'
            ])
            ->get();

        return $reservation;
    }
}
