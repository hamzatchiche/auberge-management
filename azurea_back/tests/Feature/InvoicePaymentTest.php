<?php

namespace Tests\Feature;

use App\Enums\Genre;
use App\Enums\Role;
use App\Enums\StatutFacture;
use App\Enums\StatutReservation;
use App\Mail\PaymentConfirmationMail;
use App\Models\Auberge;
use App\Models\Chambre;
use App\Models\Facture;
use App\Models\LigneFacture;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

class InvoicePaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_receptionist_payment_records_full_payment_emails_receipt_and_returns_invoice(): void
    {
        Mail::fake();

        [$receptionist, $client, $facture] = $this->createInvoiceFixture();

        $response = $this->actingAs($receptionist, 'sanctum')
            ->postJson('/api/facture/' . $facture->id);

        $response
            ->assertOk()
            ->assertJsonPath('email_envoye', true)
            ->assertJsonPath('facture.numero', 'FAC-TEST-001')
            ->assertJsonPath('facture.statut', StatutFacture::Payee->value)
            ->assertJsonPath('facture.lignes_facture.0.description', 'Séjour')
            ->assertJsonPath('paiement.montant', '350.00')
            ->assertJsonPath('paiement.mode_paiement', 'especes');

        $this->assertDatabaseHas('paiements', [
            'facture_id' => $facture->id,
            'montant' => 350,
            'mode_paiement' => 'especes',
        ]);

        Mail::assertSent(
            PaymentConfirmationMail::class,
            fn (PaymentConfirmationMail $mail) => $mail->hasTo($client->email)
                && count($mail->attachments()) === 1
        );
    }

    public function test_only_receptionists_can_pay_invoices(): void
    {
        [, $client, $facture] = $this->createInvoiceFixture();

        $this->actingAs($client, 'sanctum')
            ->postJson('/api/facture/' . $facture->id)
            ->assertForbidden();

        $this->assertDatabaseCount('paiements', 0);
        $this->assertDatabaseHas('factures', [
            'id' => $facture->id,
            'statut' => StatutFacture::NonPayee->value,
        ]);
    }

    public function test_paid_invoice_cannot_be_charged_twice(): void
    {
        Mail::fake();

        [$receptionist, $client, $facture] = $this->createInvoiceFixture();

        $this->actingAs($receptionist, 'sanctum')
            ->postJson('/api/facture/' . $facture->id)
            ->assertOk();

        $this->postJson('/api/facture/' . $facture->id)
            ->assertUnprocessable();

        $this->assertDatabaseCount('paiements', 1);
        Mail::assertSent(PaymentConfirmationMail::class, 1);
    }

    public function test_receptionist_can_resend_payment_confirmation(): void
    {
        Mail::fake();

        [$receptionist, $client, $facture] = $this->createInvoiceFixture();

        $this->actingAs($receptionist, 'sanctum')
            ->postJson('/api/facture/' . $facture->id)
            ->assertOk();

        $this->postJson('/api/facture/' . $facture->id . '/confirmation')
            ->assertOk()
            ->assertJsonPath('email_envoye', true)
            ->assertJsonPath('facture.numero', 'FAC-TEST-001');

        Mail::assertSent(
            PaymentConfirmationMail::class,
            fn (PaymentConfirmationMail $mail) => $mail->hasTo($client->email)
        );
        Mail::assertSentTimes(PaymentConfirmationMail::class, 2);
    }

    public function test_invoice_and_payment_remain_printable_if_email_sending_fails(): void
    {
        [$receptionist, , $facture] = $this->createInvoiceFixture();

        Mail::shouldReceive('to')
            ->once()
            ->with('client@example.com')
            ->andThrow(new RuntimeException('Mail transport unavailable.'));

        $this->actingAs($receptionist, 'sanctum')
            ->postJson('/api/facture/' . $facture->id)
            ->assertStatus(503)
            ->assertJsonPath('email_envoye', false)
            ->assertJsonPath('facture.numero', 'FAC-TEST-001')
            ->assertJsonPath('paiement.montant', '350.00');

        $this->assertDatabaseHas('factures', [
            'id' => $facture->id,
            'statut' => StatutFacture::Payee->value,
        ]);
        $this->assertDatabaseCount('paiements', 1);
    }

    private function createInvoiceFixture(): array
    {
        $receptionist = User::create([
            'nom' => 'Receptionniste',
            'prenom' => 'Rania',
            'genre' => Genre::Femme,
            'email' => 'reception@example.com',
            'password' => 'password',
            'role' => Role::Receptionniste,
        ]);

        $client = User::create([
            'nom' => 'Client',
            'prenom' => 'Samira',
            'genre' => Genre::Femme,
            'email' => 'client@example.com',
            'password' => 'password',
            'role' => Role::Client,
        ]);

        $auberge = Auberge::create([
            'nom' => 'Azuveria',
            'adresse' => 'Marrakech',
            'ville' => 'Marrakech',
            'telephone' => '0600000000',
        ]);

        $chambre = Chambre::create([
            'auberge_id' => $auberge->id,
            'numero' => '101',
            'type' => 'Double',
            'capacite' => 2,
            'prix_nuit' => 350,
            'status' => 'disponible',
        ]);

        $reservation = Reservation::create([
            'user_id' => $client->id,
            'chambre_id' => $chambre->id,
            'date_debut' => today(),
            'date_fin' => today()->addDay(),
            'nombre_adultes' => 2,
            'nombre_enfants' => 0,
            'statut' => StatutReservation::Confirmee,
            'prix_total' => 350,
        ]);

        $facture = Facture::create([
            'reservation_id' => $reservation->id,
            'numero' => 'FAC-TEST-001',
            'date_emission' => today(),
            'montant_total' => 350,
            'statut' => StatutFacture::NonPayee,
        ]);

        LigneFacture::create([
            'facture_id' => $facture->id,
            'description' => 'Séjour',
            'quantite' => 1,
            'prix_unitaire' => 350,
            'sous_total' => 350,
        ]);

        return [$receptionist, $client, $facture];
    }
}
