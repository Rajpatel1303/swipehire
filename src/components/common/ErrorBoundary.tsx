import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-orange-500 selection:text-white">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-slate-900 shadow-xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto shadow-md font-black text-2xl">
              S
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Something went wrong
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We encountered an unexpected issue while rendering this page. Please reload the page to continue.
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
