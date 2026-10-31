<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Request;
use function PHPUnit\Framework\throwException;

class UserManagementService
{

    public function createReceptionniste(array $data): User
    {
        $user = User::create([
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'email' => $data['email'],
            'genre' => $data['genre'],
            'role' => Role::Receptionniste->value,
            'password' => Hash::make(Str::random(64)),
        ]);

        $token = Password::createToken($user);

        $url = config('app.frontend_url')
            . '/reset-password?token=' . urlencode($token)
            . '&email=' . urlencode($user->email);

        Mail::send(
            'emails.receptionniste-activation',
            [
                'user' => $user,
                'url' => $url,
            ],
            function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Bienvenue chez Azuveria - Activez votre compte');
            }
        );

        return $user;
    }
    public function removeReceptionniste(string $id) : JsonResponse{
        $user=User::findOrFail($id);
        if($user->role===Role::Admin){
            throw new AuthorizationException('Suppression non autorisée.');
        }
        $user->delete();
      return response()->json([
        'message'=>'Le réceptionniste a été supprimé avec succès.'
      ],200);}
      
    public function getAllUsers(){
        $users=User::select('id','nom','prenom','genre','role','email','email_verified_at')->paginate(10);
        return $users;
    }
}
