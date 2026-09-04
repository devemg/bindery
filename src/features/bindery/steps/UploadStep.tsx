import { DropZone } from '../components/DropZone';
import { Notice } from '../components/Notice';
import { UploadFileIcon } from '../components/icons';
import { useBinderyContext } from '../state/binderyContext';
import { epubSummaryLine } from '../state/selectors';

export function UploadStep() {
  const { state, actions } = useBinderyContext();

  return (
    <div className="grid grid-cols-upload items-start gap-28">
      <div className="flex flex-col gap-14">
        <h2 className="font-heading text-h2 font-normal">The book file</h2>

        <DropZone variant="tall" accept=".epub,application/epub+zip" onFile={actions.selectEpub}>
          <UploadFileIcon size={26} className="text-accent" />
          <span className="flex flex-col gap-4">
            <span className="text-ui font-medium">Drop an .epub here, or choose a file</span>
            <span className="plate plate-note-wide text-plate-lg">
              Metadata inside is read and prefilled for you
            </span>
          </span>
        </DropZone>

        {state.epubName && !state.loadError && (
          <div className="card flex items-center justify-between gap-16 px-16 py-14">
            <div className="flex min-w-0 flex-col gap-3">
              <span className="truncate text-md font-medium">{state.epubName}</span>
              <span className="plate plate-note">{epubSummaryLine(state)}</span>
            </div>
            <span className="tag tag-accent">{state.isReading ? 'Reading…' : 'Read'}</span>
          </div>
        )}

        {state.loadError && <Notice>{state.loadError.message}</Notice>}
      </div>

      <aside className="flex flex-col gap-10 rounded-md bg-panel px-20 pb-22 pt-20 shadow-sm">
        <span className="plate">Ex libris</span>
        <p className="text-pretty text-prose leading-loose text-ink-muted">
          Nothing leaves this page. The file is opened locally, the portrait swapped, the record
          retyped, and a single .epub written back out.
        </p>
        <div className="rule-fade mb-2 mt-6" />
        <span className="plate plate-note leading-loose">
          Accepted: EPUB 2 and 3, up to 200 MB.
        </span>
      </aside>
    </div>
  );
}
