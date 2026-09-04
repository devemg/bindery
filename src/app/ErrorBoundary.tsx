import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

interface State {
  readonly error: Error | null;
}

/**
 * The last resort. Bindery's own failures are typed and rendered in place; this
 * catches the ones nobody predicted, and says so without pretending the work is
 * recoverable — the file never left the browser, so nothing was lost.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Bindery stopped unexpectedly.', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-40 py-64">
        <div className="flex max-w-record flex-col gap-16">
          <h1 className="font-heading text-h2 font-normal">Bindery stopped unexpectedly.</h1>
          <p className="text-pretty text-prose leading-loose text-ink-muted">
            Nothing was uploaded and nothing was lost — the book only ever existed in this tab.
            Reload the page and try again.
          </p>
          <p className="plate plate-note">{error.message}</p>
        </div>
      </div>
    );
  }
}
