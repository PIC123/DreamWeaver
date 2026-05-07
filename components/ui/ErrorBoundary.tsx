'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            style={{
              padding: '2rem',
              maxWidth: 600,
              margin: '4rem auto',
              fontFamily: 'Georgia, serif',
              color: '#fff',
              background: 'rgba(15, 12, 41, 0.95)',
              border: '1px solid rgba(183,148,246,0.3)',
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p style={{ color: '#c7b8ea' }}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.reset}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
