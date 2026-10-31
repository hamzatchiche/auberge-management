<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Mail;
use Str;

class AuthService
{

    public function register(array $data){
        $data['role']=Role::Client->value;

        $user=User::create($data);
        
        return event(new Registered($user));
    }
    public function login(array $data): array{
        $user=User::where('email',$data['email'])->first();
        if(! $user||! Hash::check($data['password'],$user->password)){
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }
        if(! $user->hasVerifiedEmail()){
            throw ValidationException::withMessages([
                'email' => ['Veuillez vérifier votre adresse email avant de vous connecter.'],
            ]);
        }
        $token=$user->createToken('auth-token')->plainTextToken;
        return [
            'user' => $user,
            'token' => $token,
        ];
    }
    public function logout(Request $request):void{
        $request->user()->currentAccessToken()->delete();
        
    }
    public function UserInfo(User $user):array{
    return    [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'email' => $user->email,
            'genre' => $user->genre,
            
    ];
    }
    public function updateProfile(User $user, array $data):void{
    $user->fill($data);
    $user->save();
   }
   public function changePassword(User $user,array $data):void{
    if(!Hash::check($data['current_password'],$user->password)){
        throw new AuthorizationException('L’ancien mot de passe est incorrect.');
    }
    $user->forceFill([
        'password' => Hash::make($data['password']),
        'remember_token' => Str::random(60),
    ]);
$user->save();
$user->tokens()->delete();
Mail::send(
    'emails.password-changed',
            ['user' => $user],
            function ($message) use ($user) {
                $message->to($user->email)
                    ->subject(
                        'Sécurité de votre compte Azuveria — Mot de passe modifié'
);});
   }
}
