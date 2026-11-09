import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../services/api';

export function useLogin() {
    return useMutation({
        mutationFn:(payload) =>AuthAPI.login(
            payload.email,
            payload.password
        )
    });
}