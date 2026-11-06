<?php

namespace App\Enums;

enum StatutReservation: string
{
    case Confirmee = 'confirmee';
    case Annulee = 'annulee';
    case EnCours = 'en_cours';
    case Terminee = 'terminee';
}
