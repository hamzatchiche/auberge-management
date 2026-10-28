<?php

namespace App\Enums;

enum Role : string
{
    case Admin='admin';
    case Receptionniste ='receptionniste';
    case Client = 'client';
}
