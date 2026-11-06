<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
</head>
<body>
    <p>Bonjour {{ $user->prenom }} {{ $user->nom }},</p>

    <p>
        Nous confirmons la réception de votre paiement de
        {{ number_format((float) $paiement->montant, 2) }} DH pour la facture
        {{ $facture->numero }}.
    </p>

    <p>
        La facture acquittée est jointe à cet email.
        Paiement reçu le {{ $paiement->date_paiement->format('d/m/Y à H:i') }}
        par {{ $paiement->mode_paiement->value }}.
    </p>

    <p>Merci d’avoir choisi Azuveria.</p>
</body>
</html>
