<?php

namespace App\Providers;

use App\Contracts\ProductRepository;
use App\Models\User;
use App\repository\ArrayProductRepository;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ProductRepository::class, ArrayProductRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(
            function (User $user,string $token):string{
                $frontendUrl = rtrim(
                config('app.frontend_url'),
                '/'
            );
            return $frontendUrl.'/reset-password?token='
            .urlencode($token)
            .'&email='
            .urlencode($user->getEmailForPasswordReset());
            }
        );
    }
}
