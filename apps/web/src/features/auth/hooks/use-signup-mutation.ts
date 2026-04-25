import { useMutation } from '@tanstack/react-query';
import { signup } from '@/features/auth/api/signup';

export function useSignupMutation() {
  return useMutation({
    mutationFn: signup,
  });
}
