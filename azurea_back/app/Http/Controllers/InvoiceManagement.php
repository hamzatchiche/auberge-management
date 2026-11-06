<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Services\InvoiceManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceManagement extends Controller
{
    public function __construct(private InvoiceManagementService $invoiceManagementService)
    {
    }

    public function getFactures()
    {
        $factures = $this->invoiceManagementService->getFactures();
        return response()->json([
            'factures' => $factures,
        ]);
    }

    public function getUserFactures(Request $request)
    {
        $factures = $this->invoiceManagementService->getUserFactures($request->user());
        return response()->json([
            'factures' => $factures
        ]);
    }

    public function payefacture(Facture $facture): JsonResponse
    {
        $this->invoiceManagementService->payefacture($facture);
        return response()->json([
            'mesage' => 'facture payée avec succès'
        ]);
    }
}
