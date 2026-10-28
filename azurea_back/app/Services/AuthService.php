<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;

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
}
