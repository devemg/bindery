import { cx } from '../../../lib/cx';
import { LAST_STEP, type Step } from '../state/types';
import { canContinue } from '../state/selectors';
import type { BinderyState } from '../state/types';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface NavBarProps {
  readonly step: Step;
  readonly hint: string;
  readonly onBack: () => void;
  readonly onForward: () => void;
  readonly onReset: () => void;
  readonly state: BinderyState;
}

export function NavBar({ step, hint, onBack, onForward, onReset, state }: NavBarProps) {
  return (
    <div className="rule-fade-t flex items-center justify-between gap-16 pt-10">
      {/* Kept in the layout on step 1 so the row does not shift. */}
      <div className="flex items-center gap-10">
        <button
          type="button"
          onClick={onBack}
          className={cx('btn btn-ghost', FOCUS, step === 0 && 'invisible')}
        >
          Back
        </button>
      </div>

      <div className="flex items-center gap-14">
        <span className="plate plate-note">{hint}</span>
        {step === LAST_STEP && (
          <button type="button" onClick={onReset} className={cx('btn btn-ghost', FOCUS)}>
            Start again
          </button>
        )}
        {step < LAST_STEP && (
          <button
            type="button"
            onClick={onForward}
            disabled={!canContinue(state)}
            className={cx('btn btn-primary', FOCUS)}
          >
            {step === 2 ? 'Review' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
