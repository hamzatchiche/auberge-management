<?php

namespace App\Enums;

enum StatutFacture: string
{
    case NonPayee = 'non_payee';
    case PartiellementPayee = 'partiellement_payee';
    case Payee = 'payee';
}
