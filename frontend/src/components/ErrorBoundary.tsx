import { Component, ErrorInfo, ReactNode, createElement } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (props: { error: Error; resetError: () => void }) => ReactNode;
}

interface State {
  error: Error | null;
}

const DEFAULT_FALLBACK = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-xl text-center bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  private resetError = () => {
    this.setState({ error: null });
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Production error boundary caught:', error, errorInfo.componentStack);
  }

  public render() {
    const { children, fallback } = this.props;
    if (this.state.error) {
      const Fallback = fallback || DEFAULT_FALLBACK;
      return createElement(Fallback, { error: this.state.error!, resetError: this.resetError });
    }
    return children;
  }
}
