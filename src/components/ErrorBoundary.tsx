import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl">⚠️</div>
            <div>
              <h1 className="text-2xl font-bold text-destructive mb-2">কিছু একটা ভুল হয়েছে</h1>
              <p className="text-muted-foreground text-sm">Something went wrong</p>
            </div>
            {this.state.error && (
              <p className="text-xs text-muted-foreground bg-muted rounded p-3 text-left font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => this.setState({ hasError: false, error: undefined })}>
                আবার চেষ্টা করুন
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                হোমে যান
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
