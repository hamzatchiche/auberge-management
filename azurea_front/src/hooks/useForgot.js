import { useMutation } from "@tanstack/react-query";
import { AuthAPI } from "../services/api";

export function useforgot(){
    return useMutation({
        mutationFn:(payload)=>AuthAPI.forgot(
            payload.email
        )
    })
}