<?php

namespace App\Enums;

enum StatutChambre: string
{
    case Disponible = 'disponible';
    case Occupee = 'occupee';
    case EnNettoyage = 'en_nettoyage';
    case EnMaintenance = 'en_maintenance';
}