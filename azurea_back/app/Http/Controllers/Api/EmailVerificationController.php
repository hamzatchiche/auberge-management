<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function verify(Request $request,string $id,string $hash){
        $user=User::findOrFail($id);
        if(!hash_equals(sha1($user->getEmailForVerification()),$hash)){
            return response()->json(
                [
                    'message'=>'lien de verification invalide',
                ],403);
        }
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect(
            rtrim(config('app.frontend_url'), '/') . '/email-verified?status=success'
        );

    }
    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Votre email est déjà vérifié.',
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Un nouveau lien de vérification a été envoyé.',
        ]);
    }
}
