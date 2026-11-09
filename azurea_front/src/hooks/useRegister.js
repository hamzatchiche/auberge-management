import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../services/api';

export function useRegister() {
    return useMutation({
        mutationFn: AuthAPI.register,
    });
}