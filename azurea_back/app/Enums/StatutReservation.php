<?php

namespace App\Enums;

enum StatutReservation: string
{
    case EnAttente = 'en_attente';
    case Confirmee = 'confirmee';
    case Annulee = 'annulee';
    case EnCours = 'en_cours';
    case Terminee = 'terminee';
}
