<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next,string $role): Response
    {
        $user=$request->user();
        
        if(!$user||$user->role->value !==$role){
    return response()->json([
        'message' => 'Forbidden: Access denied.'
    ],403);
        }
        return $next($request);
    }
}
