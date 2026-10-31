<?php

use App\Http\Controllers\administration\UserManagement;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Route;


Route::post('/auth/register',[AuthController::class,'register'])
->middleware('throttle:5,1');
Route::get('/email/verify/{id}/{hash}',[EmailVerificationController::class,'verify'])
->Middleware(['signed','throttle:6,1'])
->name('verification.verify');
Route::post(
    '/email/verification-notification',
    [EmailVerificationController::class, 'resend']
)->middleware(['auth:sanctum', 'throttle:6,1'])
 ->name('verification.send');

 Route::post('/auth/login',[AuthController::class,'login']);

Route::post('/auth/forgot-password', [
    PasswordResetController::class,
    'forgot',
])->middleware('throttle:6,1');

Route::post('/auth/reset-password', [
    PasswordResetController::class,
    'reset',
])->middleware('throttle:6,1');



Route::middleware('auth:sanctum')->group(function () {
    Route::put('/me/update', [AuthController::class, 'updateProfile']);
    Route::get('/me', [AuthController::class, 'UserInfo']);
    Route::patch('/me/changepassword',[PasswordResetController::class,'changePassword']);
});

Route::post('/auth/logout',[AuthController::class,'logout'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'role:admin'])->group(function (){
    Route::post('/administration/createReceptionniste', [UserManagement::class,'createReceptionniste']);
    Route::delete('/administration/receptionniste',[UserManagement::class, 'removeReceptionniste']);
    Route::get('/administration/AllUsers',[UserManagement::class,'getAllUsers']);

});
//  Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/me', function (Request $request) {
//         return $request->user();
//     });
// });