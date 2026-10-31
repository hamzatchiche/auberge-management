<?php

namespace App\Http\Controllers\administration;

use App\Enums\Genre;
use App\Http\Controllers\Controller;
use App\Services\UserManagementService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum as EnumRule;
class UserManagement extends Controller
{
    public function __construct(private UserManagementService $userManagementService){}
    public function createReceptionniste(Request $request){
    $data=$request->validate([
        'nom'=>['required','string','max:20'],
        'prenom'=>['required','string','max:20'],
        'genre'=>['required',new EnumRule(Genre::class)],
        'email' => ['required', 'email', 'max:255', 'unique:users,email']
    ]);
    $result=$this->userManagementService->createReceptionniste($data);
    return response()->json([
        'message'=>'Compte créé avec succès.',
        
    ],201);
   }
   public function removeReceptionniste(Request $request){
    $data = $request->validate([
        'id' => ['required', 'integer', 'exists:users,id']
    ]);
    return $this->userManagementService->removeReceptionniste($data['id']);
   }
   public function getAllUsers(){
    return $this->userManagementService->getAllUsers();
   }
}
