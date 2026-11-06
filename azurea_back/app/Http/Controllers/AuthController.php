<?php

namespace App\Http\Controllers;

use App\Enums\Genre;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum as EnumRule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Symfony\Component\HttpFoundation\JsonResponse;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService){
        
    }

   public function register(Request $request){
    $data=$request->validate([
        'nom'=>['required','string','max:20'],
        'prenom'=>['required','string','max:20'],
        'genre'=>['required',new EnumRule(Genre::class)],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'confirmed', PasswordRule::min(8)]
    ]);
    $result=$this->authService->register($data);
    return response()->json([
        'message'=>'Compte créé. Vérifiez votre boîte email pour activer votre compte.',
        
    ],201);
   }

   public function login(Request $request):JsonResponse{
    $data=$request->validate([
        'email'=>['required','email'],
        'password'=>['required','string']
    ]);
    $result=$this->authService->login($data);
    return response()->json([
        'message' => 'Connexion réussie.',
        'token' => $result['token'],
        'token_type' => 'Bearer',
        'user' => [
            'id' => $result['user']->id,
            'nom' => $result['user']->nom,
            'prenom' => $result['user']->prenom,
            'role' => $result['user']->role,
        ]
    ]);
   }
   public function logout(Request $request):JsonResponse{
    $this->authService->logout($request);
    return response()->json([
            'message'=>'logout successfully'
        ],200);
   }
   public function UserInfo(Request $request):JsonResponse{
    $user=$request->user();
    $userInfo=$this->authService->UserInfo($user);
    return response()->json([
        'user'=>$userInfo,
    ],200);
   }
   public function UpdateProfile(Request $request){
    $user=$request->user();
    $data = $request->validate([
        'nom' => ['sometimes', 'required', 'string', 'max:20'],
        'prenom' => ['sometimes', 'required', 'string', 'max:20'],
        'genre' => ['sometimes', 'required', new EnumRule(Genre::class)],
            ]);
    $this->authService->updateProfile($user,$data);
    return response()->json([
        'message'=>'Profil mis à jour avec succès.',
    ],200);
   }
}
