<?php

use App\Http\Controllers\administration\AubergeInformation;
use App\Http\Controllers\administration\RoomManagement;
use App\Http\Controllers\administration\ServiceManagement;
use App\Http\Controllers\administration\UserManagement;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InvoiceManagement;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ReservationManagement;
use App\Http\Controllers\StayManagement;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Route;


// Routes without Auth

Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:5,1');
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->Middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [
    PasswordResetController::class,
    'forgot',
])->middleware('throttle:6,1');
Route::post('/auth/reset-password', [
    PasswordResetController::class,
    'reset',
])->middleware('throttle:6,1');
Route::get('/auberge', [AubergeInformation::class, 'getAubergeInfos']);
Route::get('/chambres', [RoomManagement::class, 'getChambres']);
Route::get('/availableChambres', [RoomManagement::class, 'getAvailablechambres']);
Route::get('/services', [ServiceManagement::class, 'getServices']);



// routes need login from all users
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
    ->middleware('throttle:2,1')->name('verification.send');
    Route::patch('/me/changepassword', [PasswordResetController::class, 'changePassword']);
    Route::put('/me/update', [AuthController::class, 'updateProfile']);
    Route::get('/me', [AuthController::class, 'UserInfo']);
    Route::post('/chambres/{chambre}/reservation', [ReservationManagement::class, 'createreservation']);
    Route::patch('/reservations/{reservation}/cancel', [ReservationManagement::class, 'cancelReservation']);
    Route::get('/me/reservations', [ReservationManagement::class, 'getUserReservations']);
    Route::get('/me/reservations/{reservationId}', [ReservationManagement::class, 'getUserReservationById']);
    Route::get('/me/factures',[InvoiceManagement::class, 'getUserFactures']);
    Route::patch('/reservations/{reservation}/services',[ReservationManagement::class, 'addServiceToReservation']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/reservation/{reservation}', [ReservationManagement::class, 'getReservationById']);
    });

// route for admin
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/administration/createReceptionniste', [UserManagement::class, 'createReceptionniste']);
    Route::delete('/administration/receptionniste', [UserManagement::class, 'removeReceptionniste']);
    Route::get('/administration/AllUsers', [UserManagement::class, 'getAllUsers']);
    Route::patch('/auberge/{auberge}', [AubergeInformation::class, 'updateAubergeInfo']);
});

// routes for reception
Route::middleware(['auth:sanctum', 'role:receptionniste'])->group(function () {
    Route::post('/chambre', [RoomManagement::class, 'createChambre']);
    Route::patch('/chambre/{chambre}', [RoomManagement::class, 'updateChambre']);
    Route::patch('/chambre/{chambre}/status', [RoomManagement::class, 'updateStatusChambre']);
    Route::delete('/chambre/{chambre}', [RoomManagement::class, 'deleteChambre']);
    Route::get('/factures', [InvoiceManagement::class, 'getFactures']);
    Route::post('/facture/{facture}', [InvoiceManagement::class, 'payefacture']);
    Route::post('/facture/{facture}/resend-confirmation', [InvoiceManagement::class, 'resendPaymentConfirmation']);
    Route::post('/reservation/{reservation}/CheckIn', [StayManagement::class, 'CheckIn']);
    Route::get('/reservations/CheckIn', [StayManagement::class, 'getCheckIntoday']);
    Route::post('/reservation/{reservation}/CheckOut', [StayManagement::class, 'CheckOut']);
    Route::get('/reservations/CheckOut', [StayManagement::class, 'getCheckOuttoday']);
    Route::get('/reservations', [ReservationManagement::class, 'getAllReservations']);
    // services
    Route::post('/service', [ServiceManagement::class, 'addService']);
    Route::patch('/service/{service}', [ServiceManagement::class, 'updateService']);
    Route::delete('/service/{service}', [ServiceManagement::class, 'deleteService']);
});
