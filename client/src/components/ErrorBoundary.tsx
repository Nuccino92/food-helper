import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-100">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-neutral-400">
            Try refreshing the page to get back on track.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm transition-colors hover:bg-neutral-700"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
