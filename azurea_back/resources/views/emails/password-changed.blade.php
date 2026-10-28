
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mot de passe modifié</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial,Helvetica,sans-serif; color:#243047;">
    <p>Bonjour {{ $user->prenom }} {{ $user->nom }},</p>
    <div style="display:none; font-size:1px; color:#f4f6f8; line-height:1px;">
        Votre mot de passe Azuveria a été modifié avec succès.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="background-color:#f4f6f8; padding:35px 12px;">
        <tr>
            <td align="center">

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                       style="max-width:580px; background-color:#ffffff; border-radius:12px; overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#173b35; padding:28px 35px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:28px; letter-spacing:2px;">
                                AZUVERIA
                            </h1>
                            <p style="margin:8px 0 0; color:#d6e6df; font-size:12px; letter-spacing:1px;">
                                VOTRE SÉJOUR, NOTRE PRIORITÉ
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:35px 30px;">

                            <div style="text-align:center; margin-bottom:22px;">
                                <div style="display:inline-block; width:60px; height:60px;
                                            line-height:60px; border-radius:50%;
                                            background-color:#e4f4eb; color:#218653;
                                            font-size:30px; font-weight:bold;">
                                    &#10003;
                                </div>
                            </div>

                            <h2 style="margin:0 0 18px; text-align:center; color:#173b35; font-size:23px;">
                                Mot de passe modifié
                            </h2>

                            <p style="font-size:15px; line-height:1.8; margin:0 0 15px;">
                                Bonjour,
                            </p>

                            <p style="font-size:15px; line-height:1.8; margin:0 0 20px;">
                                Nous vous confirmons que le mot de passe associé à votre compte
                                <strong>Azuveria</strong> a été modifié avec succès.
                            </p>

                            <div style="background-color:#f0f7f3; border-left:4px solid #218653;
                                        padding:16px; margin:22px 0;">
                                <p style="margin:0; font-size:14px; line-height:1.7;">
                                    <strong>Vous êtes à l’origine de ce changement ?</strong><br>
                                    Vous n’avez aucune action supplémentaire à effectuer.
                                </p>
                            </div>

                            <div style="background-color:#fff5f3; border:1px solid #f3d4ce;
                                        border-radius:8px; padding:18px; margin:22px 0;">
                                <p style="margin:0 0 8px; color:#a33c2e; font-size:14px; font-weight:bold;">
                                    Vous n’avez pas modifié votre mot de passe ?
                                </p>
                                <p style="margin:0; color:#65433e; font-size:14px; line-height:1.7;">
                                    Nous vous recommandons de sécuriser votre compte immédiatement
                                    et de contacter notre équipe d’assistance si nécessaire.
                                </p>
                            </div>

                            <p style="font-size:15px; line-height:1.8; margin-top:25px;">
                                Merci de faire confiance à Azuveria.
                                <br>
                                <strong style="color:#173b35;">L’équipe Azuveria</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8faf9; border-top:1px solid #e8eeeb;
                                   padding:22px 30px; text-align:center;">
                            <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
                                Cet e-mail est un message automatique de sécurité.
                            </p>
                            <p style="margin:0; font-size:12px; color:#94a3b8;">
                                &copy; {{ date('Y') }} Azuveria. Tous droits réservés.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>

