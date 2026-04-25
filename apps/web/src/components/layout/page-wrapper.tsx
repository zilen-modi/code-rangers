import { Container } from './container';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-8 md:py-12 animate-fade-in">
      <Container>{children}</Container>
    </section>
  );
}
