'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useSignupMutation } from '@/features/auth/hooks/use-signup-mutation';
import { loginSchema, type LoginSchema } from '@/features/auth/schema';
import { useUser } from '@/providers/user-provider';
import { getErrorMessage } from '@/services/error-handler';
import { ButtonLoading } from '@/components/common/button-loading';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SignupForm() {
  const { setUser } = useUser();
  const signupMutation = useSignupMutation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginSchema) => {
    try {
      const response = await signupMutation.mutateAsync(values);
      setUser(response.user);
      toast.success('Account created successfully.');
      router.push('/todos');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-premium"
      data-premium-card="true"
    >
      <div>
        <h2 className="text-2xl font-semibold">Sign Up</h2>
        <p className="text-sm text-muted-foreground">Create an account to manage your todos.</p>
      </div>

      <div className="space-y-1">
        <Input
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="transition-shadow focus-visible:ring-2"
        />
        {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1">
        <Input
          type="password"
          placeholder="********"
          {...register('password')}
          className="transition-shadow focus-visible:ring-2"
        />
        {errors.password ? <p className="text-sm text-red-500">{errors.password.message}</p> : null}
      </div>

      <Button type="submit" className="w-full transition-transform hover:-translate-y-0.5" disabled={signupMutation.isPending}>
        {signupMutation.isPending ? <ButtonLoading label="Signing up" /> : 'Create Account'}
      </Button>

      <div className="text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </form>
  );
}
