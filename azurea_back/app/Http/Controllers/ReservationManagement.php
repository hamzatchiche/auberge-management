<?php

namespace App\Http\Controllers;

use App\Models\Chambre;
use App\Models\Facture;
use App\Models\Reservation;
use App\Services\ReservationManagementService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Mail;

class ReservationManagement extends Controller
{
    public function __construct(
        private ReservationManagementService $reservationService
    ) {
    }
    public function createreservation(Request $request, Chambre $chambre)
    {
        $data = $request->validate([
            'date_debut' => ['required', 'date', 'after_or_equal:today'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
            'nombre_adultes' => ['required', 'integer', 'min:1'],
            'nombre_enfants' => ['required', 'integer', 'min:0'],

            'services' => ['sometimes', 'array'],
            'services.*.service_id' => ['required', 'integer', 'distinct', 'exists:services,id'],
            'services.*.quantite' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);
        $reservation = $this->reservationService->createreservation($chambre, $request->user(), $data);
        $reservation->load([
            'user',
            'chambre',
            'reservationServices.service',
            'facture.lignesFacture',
        ]);
        $pdf = Pdf::loadView('emails.reservation-facture', [
            'user' => $request->user(),
            'reservation' => $reservation,
        ]);
        Mail::send(
            'emails.reservation-confirmation',
            [
                'user' => $request->user(),
                'reservation' => $reservation,
            ],

            function ($message) use ($request, $reservation, $pdf) {
                $message
                    ->to($request->user()->email)
                    ->subject('Confirmation de votre réservation - Azuveria')
                    ->attachData(
                        $pdf->output(),
                        'reservation-' . $reservation->id . '.pdf',
                        [
                            'mime' => 'application/pdf',
                        ]
                    );
            }
        );
        return response()->json([
            'message' => 'Votre réservation a été confirmée avec succès.',
            'reservation' => $reservation,
        ], 201);
    }
    public function getUserReservations(Request $request): JsonResponse
    {
        $reservations = $this->reservationService->getUserReservations($request->user());
        return response()->json([
            'reservations' => $reservations,
        ]);
    }
    public function getUserReservationById(
    Request $request,
    int $reservationId
): JsonResponse {

    $reservation = $this->reservationService
        ->getUserReservationById(
            $request->user(),
            $reservationId
        );

    return response()->json([
        'reservation' => $reservation,
    ]);
}
    public function cancelReservation(
        Reservation $reservation,
        Request $request
    ): JsonResponse {
        $reservation = $this->reservationService->cancelReservation(
            $reservation,
            $request->user()
        );

        return response()->json([
            'message' => 'Réservation annulée avec succès.'
        ]);
    }
    public function getFactures(){
        $factures= $this->reservationService->getFactures();
        return response()->json([
            'factures'=>$factures,
        ]);
    }
    public function getUserFactures(Request $request){
        $factures=$this->reservationService->getUserFactures($request->user());
        return response()->json([
            'factures'=>$factures
        ]);
    }
    public function payefacture(Facture $facture):JsonResponse{
        $this->reservationService->payefacture($facture);
        return response()->json([
            'mesage'=>'facture payée avec succès'
        ]);
    }
    public function addServicetoReservation( Request $request,
    Reservation $reservation):JsonResponse{
         $data = $request->validate([
        'services' => ['required', 'array', 'min:1'],

        'services.*.service_id' => [
            'required',
            'integer',
            'distinct',
            'exists:services,id',
        ],

        'services.*.quantite' => [
            'required',
            'integer',
            'min:1',
        ],
    ]);
    $reservationupdated=$this->reservationService->addServicetoReservation($reservation
    ,$request->user(),$data);
    $reservation->load([
            'user',
            'chambre',
            'reservationServices.service',
            'facture.lignesFacture',
        ]);
    $pdf = Pdf::loadView('emails.reservation-facture', [
            'user' => $request->user(),
            'reservation' => $reservation,
        ]);
        Mail::send(
            'emails.add-service',
            [
                'user' => $request->user(),
                'reservation' => $reservation,
            ],

            function ($message) use ($request, $reservation, $pdf) {
                $message
                    ->to($request->user()->email)
                    ->subject('Confirmation de votre réservation - Azuveria')
                    ->attachData(
                        $pdf->output(),
                        'reservation-' . $reservation->id . '.pdf',
                        [
                            'mime' => 'application/pdf',
                        ]
                    );
            }
        );
    return response()->json([
        'message' => 'Les services ont été ajoutés à la réservation.'
    ]);
    }
    public function CheckIn(Reservation $reservation):JsonResponse{
        $reservation=$this->reservationService->CheckIn($reservation);
         return response()->json([
            'message'=>'check In fait avec succès'
        ]);
    }
    public function CheckOut(Reservation $reservation):JsonResponse{
    $this->reservationService->CheckOut($reservation);
    return response()->json([
        'message'=>'check out fait avec succès',
    ]);
    }
}
