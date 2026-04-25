export type PromptBuilderInput = {
  system?: string;
  context?: string;
  user: string;
};

export function buildPrompt({ system, context, user }: PromptBuilderInput): string {
  const sections = [
    system ? `### System\n${system.trim()}` : null,
    context ? `### Context\n${context.trim()}` : null,
    `### User\n${user.trim()}`,
  ].filter(Boolean);

  return sections.join('\n\n');
}
