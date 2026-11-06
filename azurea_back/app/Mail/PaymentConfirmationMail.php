<?php

namespace App\Mail;

use App\Models\Facture;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Facture $facture,
        public Paiement $paiement,
        private string $pdfContent
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmation de paiement - Facture ' . $this->facture->numero,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.confirmation-paiement',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(
                fn () => $this->pdfContent,
                'facture-' . $this->facture->numero . '.pdf'
            )->withMime('application/pdf'),
        ];
    }
}
