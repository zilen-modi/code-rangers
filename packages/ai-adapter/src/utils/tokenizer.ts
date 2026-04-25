const TOKEN_ESTIMATE_RATIO = 4;

export function estimateTokens(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return Math.ceil(text.length / TOKEN_ESTIMATE_RATIO);
}
