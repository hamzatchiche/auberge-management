<?php

use App\Http\Controllers\administration\AubergeManagement;
use App\Http\Controllers\administration\UserManagement;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ReservationManagement;
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

Route::get('/auberge',[AubergeManagement::class,'getAubergeInfos']);

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/me/update', [AuthController::class, 'updateProfile']);
    Route::get('/me', [AuthController::class, 'UserInfo']);
    Route::patch('/me/changepassword',[PasswordResetController::class,'changePassword']);
    Route::post('/chambres/{chambre}/reservation',[ReservationManagement::class,'createreservation']);
    Route::patch('/reservations/{reservation}/cancel',[ReservationManagement::class, 'cancelReservation']);
    Route::get('/me/reservations',[ReservationManagement::class, 'getUserReservations']);
    Route::get('/me/reservations/{reservationId}',[ReservationManagement::class, 'getUserReservationById']);
});

Route::post('/auth/logout',[AuthController::class,'logout'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'role:admin'])->group(function (){
    Route::post('/administration/createReceptionniste', [UserManagement::class,'createReceptionniste']);
    Route::delete('/administration/receptionniste',[UserManagement::class, 'removeReceptionniste']);
    Route::get('/administration/AllUsers',[UserManagement::class,'getAllUsers']);
    Route::patch('/auberge/{auberge}',[AubergeManagement::class,'updateAubergeInfo']);
});
Route::get('/chambres',[AubergeManagement::class,'getChambres']);
Route::get('/availableChambres',[AubergeManagement::class,'getAvailablechambres']);
Route::get('/services',[AubergeManagement::class,'getServices']);
Route::middleware(['auth:sanctum','role:receptionniste'])->group(function(){
    Route::post('/chambre',[AubergeManagement::class,'createChambre']);
    Route::patch('/chambre/{chambre}',[AubergeManagement::class,'updateChambre']);
    Route::delete('/chambre/{chambre}',[AubergeManagement::class,'deleteChambre']);
    // services
    Route::post('/service',[AubergeManagement::class,'addService']);
    Route::patch('/service/{service}',[AubergeManagement::class,'updateService']);
    Route::delete('/service/{service}',[AubergeManagement::class,'deleteService']);
});
