<?php

namespace App\Http\Controllers;

use App\Models\User;
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
        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill(
                    [
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ]
                )->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));


                Mail::send('emails.password-changed', ['user' => $user], function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Sécurité de votre compte Azuveria — Mot de passe modifié');
                });
                //          Mail::raw(
                //     'Votre mot de passe Azuveria a été modifié avec succès. Si vous n’êtes pas à l’origine de cette modification, contactez notre support.',
                //     function ($message) use ($user) {
                //         $message->to($user->email)
                //                 ->subject('Confirmation de changement de mot de passe - Azuveria');
                //     }
                // );
            }

        );
        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Le lien est invalide ou a expiré. Demandez un nouveau lien.',
            ], 422);
        }
        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }
}
