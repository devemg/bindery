import { cx } from '../../../lib/cx';
import { Notice } from '../components/Notice';
import { SummaryTable } from '../components/SummaryTable';
import { useBinderyContext } from '../state/binderyContext';
import { buildLabel, buildNote, summaryRows } from '../state/selectors';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function BindStep() {
  const { state, actions } = useBinderyContext();
  const { build } = state;
  const isBuilding = build.kind === 'building';

  return (
    <div className="wizard-panel grid grid-cols-bind items-start gap-34">
      <div className="flex flex-col gap-18">
        <h2 className="font-heading text-h2 font-normal">
          Ready to bind
          <span className="mobile-step-label">Step 4 of 4</span>
        </h2>

        <SummaryTable rows={summaryRows(state)} />

        <div className="flex flex-col gap-8 pt-4">
          <div className="flex items-center gap-16">
            <button
              type="button"
              onClick={actions.bind}
              disabled={isBuilding || state.archive === null}
              className={cx('btn btn-primary', FOCUS)}
            >
              {buildLabel(state)}
            </button>
            <span className="plate plate-note">{buildNote(state)}</span>
          </div>

          {/* A hairline that fills — the only motion the design allows itself. */}
          {isBuilding && (
            <div
              className="h-px w-full bg-line"
              role="progressbar"
              aria-label="Binding"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(build.progress * 100)}
            >
              <div
                className="h-px bg-accent transition-[width]"
                style={{ width: `${String(Math.round(build.progress * 100))}%` }}
              />
            </div>
          )}

          {/*
           * The outcome, announced. `atomic` so a screen reader reads the whole
           * sentence rather than the words that changed.
           */}
          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {build.kind === 'done' && `Bound. Saved as ${build.filename}.`}
            {build.kind === 'error' && `Binding failed. ${build.error.message}`}
          </p>

          {build.kind === 'error' && <Notice live={false}>{build.error.message}</Notice>}
          {state.archive === null && (
            <Notice live={false}>
              No book is loaded yet — go back to the first step and choose an .epub.
            </Notice>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-12 rounded-md bg-panel p-18 shadow-sm">
        <div className="flex h-208 w-130 items-center justify-center overflow-hidden rounded-screen bg-screen">
          {state.coverUrl ? (
            <img
              src={state.coverUrl}
              alt="Cover preview"
              className={cx(
                'h-full w-full',
                state.fit === 'crop' ? 'object-cover' : 'object-contain',
              )}
            />
          ) : (
            <span className="plate tracking-caption">No portrait</span>
          )}
        </div>
        <span className="text-center font-heading text-ui leading-heading">{state.meta.title}</span>
        <span className="plate plate-note">{state.meta.author}</span>
      </div>
    </div>
  );
}
