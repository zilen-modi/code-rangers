'use client';

import React from 'react';
import { ErrorFallback } from './error-fallback';

type State = { hasError: boolean; errorMessage?: string };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI runtime error:', error, errorInfo);
  }

  private reset = () => this.setState({ hasError: false, errorMessage: undefined });

  render() {
    if (this.state.hasError) {
      return <ErrorFallback description={this.state.errorMessage} onRetry={this.reset} />;
    }

    return this.props.children;
  }
}
