import { ErrorBoundary } from '@/components/common/error-boundary';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { LoginForm } from '@/features/auth/components/login-form';

export default function HomePage() {
  return (
    <PageWrapper>
      <ErrorBoundary>
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border px-3 py-1 text-xs text-muted-foreground">
              Premium UI foundation
            </span>
            <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Build delightful product experiences faster.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Clean architecture, consistent design tokens, and polished micro-interactions powered by
              App Router + shadcn + React Query.
            </p>
          </div>
          <LoginForm />
        </div>
      </ErrorBoundary>
    </PageWrapper>
  );
}
