<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Services\StayManagementService;
use Illuminate\Http\JsonResponse;

class StayManagement extends Controller
{
    public function __construct(private StayManagementService $stayManagementService)
    {
    }

    public function CheckIn(Reservation $reservation): JsonResponse
    {
        $reservation = $this->stayManagementService->CheckIn($reservation);
        return response()->json([
            'message' => 'check In fait avec succès'
        ]);
    }

    public function getCheckIntoday()
    {
        $reservation = $this->stayManagementService->getCheckIntoday();
        return response()->json([
            'response' => $reservation
        ]);
    }

    public function CheckOut(Reservation $reservation): JsonResponse
    {
        $this->stayManagementService->CheckOut($reservation);
        return response()->json([
            'message' => 'check out fait avec succès',
        ]);
    }

    public function getCheckOuttoday()
    {
        $reservation = $this->stayManagementService->getCheckOuttoday();
        return response()->json([
            'response' => $reservation
        ]);
    }
}
