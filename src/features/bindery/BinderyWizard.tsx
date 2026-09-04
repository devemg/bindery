import type { ComponentType } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { NavBar } from './components/NavBar';
import { Stepper } from './components/Stepper';
import { useBinderyContext } from './state/binderyContext';
import { hintFor } from './state/selectors';
import { BindStep } from './steps/BindStep';
import { PortraitStep } from './steps/PortraitStep';
import { RecordStep } from './steps/RecordStep';
import { UploadStep } from './steps/UploadStep';
import type { Step } from './state/types';

const PANELS: Record<Step, ComponentType> = {
  0: UploadStep,
  1: PortraitStep,
  2: RecordStep,
  3: BindStep,
};

/** Chrome and step orchestration. Every step reads its own state from context. */
export function BinderyWizard() {
  const { state, actions } = useBinderyContext();
  const Panel = PANELS[state.step];

  return (
    <div className="flex min-h-screen flex-col items-center justify-between gap-16 bg-page px-40 pb-64 pt-44 font-body text-ink">
      <div className="mx-16 flex w-full max-w-page flex-col gap-34">
        <Header />
        <Stepper current={state.step} onGoToStep={actions.goToStep} />

        <section className="flex flex-col gap-26">
          <Panel />
          <NavBar
            step={state.step}
            hint={hintFor(state)}
            onBack={actions.back}
            onForward={actions.forward}
            onReset={actions.reset}
          />
        </section>
      </div>
      <Footer />
    </div>
  );
}
