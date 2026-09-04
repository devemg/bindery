import { BinderyWizard } from '../features/bindery/BinderyWizard';
import { BinderyProvider } from '../features/bindery/state/context';
import { ErrorBoundary } from './ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <BinderyProvider>
        <BinderyWizard />
      </BinderyProvider>
    </ErrorBoundary>
  );
}
