import { cx } from '../../../lib/cx';
import { LAST_STEP, STEP_NAMES, type Step } from '../state/types';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface StepperProps {
  readonly current: Step;
  readonly onGoToStep: (step: Step) => void;
}

/**
 * Four circles and their names. Every step is reachable at any time — the
 * handoff is explicit that the stepper jumps rather than gates, and the hints
 * beside Continue carry the advice instead.
 */
export function Stepper({ current, onGoToStep }: StepperProps) {
  return (
    <nav aria-label="Rebinding steps">
      <ol className="flex list-none items-center">
        {STEP_NAMES.map((name, index) => {
          const step = index as Step;
          const isCurrent = step === current;
          const isDone = step < current;

          return (
            <li key={name} className="flex min-w-0 flex-1 items-center">
              <button
                type="button"
                onClick={() => {
                  onGoToStep(step);
                }}
                aria-current={isCurrent ? 'step' : undefined}
                className={cx(
                  'flex size-30 flex-none items-center justify-center rounded-full border',
                  'font-heading text-sm',
                  FOCUS,
                  isCurrent && 'border-accent bg-tint-strong text-accent-300 shadow-step',
                  isDone && 'border-accent-700 bg-transparent text-accent-400',
                  !isCurrent && !isDone && 'border-line bg-transparent text-ink-faint',
                )}
              >
                <span aria-hidden="true">{isDone ? '✓' : index + 1}</span>
                <span className="sr-only">
                  {`Step ${String(index + 1)}: ${name}${isDone ? ' (done)' : ''}`}
                </span>
              </button>

              <span className="flex min-w-0 flex-col gap-2 pl-10" aria-hidden="true">
                <span className={cx('plate', isCurrent ? 'text-accent' : 'text-ink-ghost')}>
                  Step {index + 1}
                </span>
                <span
                  className={cx(
                    'whitespace-nowrap font-heading text-ui',
                    isCurrent || isDone ? 'text-ink' : 'text-ink-faint',
                  )}
                >
                  {name}
                </span>
              </span>

              {step < LAST_STEP && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'mx-14 h-px min-w-connector flex-1',
                    isDone ? 'bg-connector-done' : 'bg-connector-next',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
