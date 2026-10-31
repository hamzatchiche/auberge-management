
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activation du compte</title>
</head>

<body style="margin:0; padding:30px 10px; background:#f4f6f5; font-family:Arial,sans-serif;">

    <div style="max-width:560px; margin:auto; background:white; border-radius:12px; overflow:hidden;">

        <div style="background:#173b35; padding:30px; text-align:center;">
            <h1 style="color:white; margin:0; letter-spacing:3px;">
                AZUVERIA
            </h1>
            <p style="color:#d6e6df; font-size:12px;">
                ESPACE ADMINISTRATION
            </p>
        </div>

        <div style="padding:35px 30px; color:#243047;">

            <h2>Bienvenue {{ $user->prenom }} !</h2>

            <p style="line-height:1.8;">
                Votre compte réceptionniste Azuveria a été créé
                par l'administrateur.
            </p>

            <p style="line-height:1.8;">
                Pour activer votre compte et définir votre mot de passe,
                veuillez cliquer sur le bouton ci-dessous.
            </p>

            <div style="text-align:center; margin:30px 0;">
                <a href="{{ $url }}"
                   style="display:inline-block; background:#173b35;
                   color:white; padding:14px 28px; border-radius:6px;
                   text-decoration:none; font-weight:bold;">
                    Activer mon compte
                </a>
            </div>

            <p style="font-size:13px; color:#64748b; line-height:1.7;">
                Ce lien est personnel et temporaire.
                Si vous n'attendiez pas cet email, veuillez contacter
                l'administrateur.
            </p>

            <p style="margin-top:25px;">
                Cordialement,<br>
                <strong>L'équipe Azuveria</strong>
            </p>

        </div>

        <div style="background:#f8faf9; padding:20px; text-align:center;">
            <p style="font-size:12px; color:#94a3b8;">
                &copy; {{ date('Y') }} Azuveria. Tous droits réservés.
            </p>
        </div>

    </div>

</body>
</html>
