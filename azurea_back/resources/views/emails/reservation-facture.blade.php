<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 25px;
        }

        .header h1 {
            color: #8b6b4a;
            margin-bottom: 5px;
        }

        .section-title {
            background: #f2ece5;
            padding: 8px;
            margin-top: 20px;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background: #f8f5f1;
        }

        .total {
            text-align: right;
            font-size: 15px;
            font-weight: bold;
            margin-top: 15px;
        }

        .footer {
            text-align: center;
            margin-top: 35px;
            color: #777;
        }
    </style>
</head>

<body>

    <div class="header">
        <h1>Azuveria</h1>
        @if (isset($paiement))
            <p>Facture acquittée — confirmation de paiement</p>
        @else
            <p>Confirmation de réservation et facture</p>
        @endif
    </div>

    <p>Bonjour {{ $user->prenom }} {{ $user->nom }},</p>

    @if (isset($paiement))
        <p>
            Nous confirmons la réception de votre paiement de
            {{ number_format((float) $paiement->montant, 2) }} DH.
            Vous trouverez votre facture acquittée en pièce jointe.
        </p>
    @else
        <p>
            Votre réservation chez Azuveria a été confirmée avec succès.
            Vous trouverez ci-dessous les détails de votre réservation et votre facture.
        </p>
    @endif

    <div class="section-title">
        Informations de réservation
    </div>

    <table>
        <tr>
            <th>Numéro de réservation</th>
            <td>{{ $reservation->id }}</td>
        </tr>
        <tr>
            <th>Chambre</th>
            <td>{{ $reservation->chambre->numero }}</td>
        </tr>
        <tr>
            <th>Type de chambre</th>
            <td>{{ $reservation->chambre->type }}</td>
        </tr>
        <tr>
            <th>Date d'arrivée</th>
            <td>{{ $reservation->date_debut->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <th>Date de départ</th>
            <td>{{ $reservation->date_fin->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <th>Nombre de nuits</th>
            <td>{{ $reservation->date_debut->diffInDays($reservation->date_fin) }}</td>
        </tr>
        <tr>
            <th>Adultes</th>
            <td>{{ $reservation->nombre_adultes }}</td>
        </tr>
        <tr>
            <th>Enfants</th>
            <td>{{ $reservation->nombre_enfants }}</td>
        </tr>
        <tr>
            <th>Statut</th>
            <td>{{ $reservation->statut->value }}</td>
        </tr>
    </table>

    <div class="section-title">
        Facture {{ $reservation->facture->numero }}
    </div>

    <p>
        Date d'émission :
        {{ $reservation->facture->date_emission->format('d/m/Y') }}
    </p>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Sous-total</th>
            </tr>
        </thead>

        <tbody>
            @foreach ($reservation->facture->lignesFacture as $ligne)
                <tr>
                    <td>{{ $ligne->description }}</td>
                    <td>{{ $ligne->quantite }}</td>
                    <td>{{ number_format((float) $ligne->prix_unitaire, 2) }} DH</td>
                    <td>{{ number_format((float) $ligne->sous_total, 2) }} DH</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="total">
        Total : {{ number_format((float) $reservation->facture->montant_total, 2) }} DH
    </p>

    <p>
        Statut de la facture :
        {{ $reservation->facture->statut->value }}
    </p>

    @if (isset($paiement))
        <p>
            Paiement reçu le {{ $paiement->date_paiement->format('d/m/Y à H:i') }}
            par {{ $paiement->mode_paiement->value }}.
        </p>
    @endif

    <div class="footer">
        <p>Merci d'avoir choisi Azuveria.</p>
        <p>Nous vous souhaitons un agréable séjour !</p>
    </div>

</body>
</html>