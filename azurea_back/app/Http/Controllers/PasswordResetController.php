<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use App\Services\AuthService;
use Hash;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Str;

class PasswordResetController extends Controller
{
    public function __construct(private AuthService $authService)
    {
    }
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', "email"]
        ]);
        $status = Password::sendResetLink([
            'email' => $data['email']
        ]);
        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                'message' => 'Veuillez patienter avant de réessayer.',
            ], 429);
        }
        return response()->json([
            'message' => 'un lien de réinitialisation sera envoyé.'
        ]);
    }
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
        ]);
        $resetUser = null;
        $status = Password::reset(
            $data,
            function (User $user, string $password) use (&$resetUser) {

                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ]);

                if (
                    $user->role === Role::Receptionniste
                    && $user->email_verified_at === null
                ) {
                    $user->email_verified_at = now();
                }
                
                $user->save();

                $user->tokens()->delete();

                $resetUser = $user;
            }
        );
        if($status!==Password::PASSWORD_RESET){
            return response()->json([
                'message'=> 'Le lien de réinitialisation est invalide ou expiré.'
            ],422);
        }
        Mail::send(
            'emails.password-changed',
            ['user' => $resetUser],
            function ($message) use ($resetUser) {
                $message->to($resetUser->email)
                    ->subject(
                        'Sécurité de votre compte Azuveria — Mot de passe modifié'
                    );
            }
        );

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
        ]);
        $user = $request->user();
        $this->authService->changePassword($user, $data);
        return response()->json([
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }
}