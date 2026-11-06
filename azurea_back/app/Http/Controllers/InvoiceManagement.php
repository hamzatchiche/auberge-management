<?php

namespace App\Http\Controllers;

use App\Mail\PaymentConfirmationMail;
use App\Models\Facture;
use App\Services\InvoiceManagementService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

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
        $facture = $this->invoiceManagementService->payefacture($facture);

        return $this->sendPaymentConfirmation($facture);
    }

    public function resendPaymentConfirmation(Facture $facture): JsonResponse
    {
        $facture = $this->invoiceManagementService->getPaidInvoiceReceipt($facture);

        return $this->sendPaymentConfirmation($facture);
    }

    private function sendPaymentConfirmation(Facture $facture): JsonResponse
    {
        $user = $facture->reservation->user;
        $payment = $facture->paiement->sortByDesc('date_paiement')->first();

        if (!$payment) {
            throw new \LogicException('Une facture payée doit avoir un paiement associé.');
        }

        try {
            $pdf = Pdf::loadView('emails.reservation-facture', [
                'user' => $user,
                'reservation' => $facture->reservation,
                'paiement' => $payment,
            ]);

            Mail::to($user->email)->send(new PaymentConfirmationMail(
                $user,
                $facture,
                $payment,
                $pdf->output()
            ));
        } catch (Throwable $exception) {
            report($exception);

            return $this->paymentResponse(
                $facture,
                'Le paiement est enregistré, mais l’email n’a pas pu être envoyé. Vous pouvez imprimer la facture retournée ou réessayer l’envoi.',
                false,
                503
            );
        }

        return $this->paymentResponse(
            $facture,
            'Paiement enregistré. La confirmation et la facture ont été envoyées au client.',
            true
        );
    }

    private function paymentResponse(
        Facture $facture,
        string $message,
        bool $emailEnvoye,
        int $status = 200
    ): JsonResponse {
        return response()->json([
            'message' => $message,
            'email_envoye' => $emailEnvoye,
            'facture' => $facture,
            'paiement' => $facture->paiement->sortByDesc('date_paiement')->first(),
        ], $status);
    }
}
