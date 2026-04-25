import { ErrorBoundary } from '@/components/common/error-boundary';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { SignupForm } from '@/features/auth/components/signup-form';

export default function SignupPage() {
  return (
    <PageWrapper>
      <ErrorBoundary>
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border px-3 py-1 text-xs text-muted-foreground">
              Unlock productivity
            </span>
            <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create your account to start managing your tasks.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Join today to securely organize and build your Todo platform powered by our fast
              backend.
            </p>
          </div>
          <SignupForm />
        </div>
      </ErrorBoundary>
    </PageWrapper>
  );
}
