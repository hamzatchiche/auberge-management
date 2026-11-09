import { useMutation } from "@tanstack/react-query";
import { AuthAPI } from "../services/api";

export function useReset() {
  return useMutation({
    mutationFn: (payload) => AuthAPI.reset(payload),
  });
}