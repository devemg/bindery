import { cx } from '../../../lib/cx';
import type { Fit } from '../../../lib/epub/types';
import { DevicePreview } from '../components/DevicePreview';
import { DropZone } from '../components/DropZone';
import { Notice } from '../components/Notice';
import { SegmentedControl, type SegmentOption } from '../components/SegmentedControl';
import { ImageIcon } from '../components/icons';
import { useBinderyContext } from '../state/binderyContext';
import { coverSourceLine, lowResMessage } from '../state/selectors';

const FIT_OPTIONS: readonly SegmentOption<Fit>[] = [
  { value: 'crop', label: 'Crop to fill' },
  { value: 'pad', label: 'Fit whole, pad edges' },
];

export function PortraitStep() {
  const { state, actions, settings } = useBinderyContext();
  const lowRes = lowResMessage(state, settings.lowResThreshold);

  return (
    <div
      className={cx(
        'wizard-panel',
        'grid items-start gap-34',
        settings.showKindlePreview ? 'grid-cols-portrait' : 'grid-cols-portrait-solo',
      )}
    >
      <div className="flex flex-col gap-16">
        <h2 className="font-heading text-h2 font-normal">
          The portrait
          <span className="mobile-step-label">Step 2 of 4</span>
        </h2>

        <DropZone variant="inline" accept="image/*" onFile={actions.selectCover}>
          <ImageIcon size={22} className="text-accent" />
          <span className="flex flex-col gap-3">
            <span className="text-md font-medium">Choose a cover image</span>
            <span className="plate plate-note">JPEG or PNG · target 1600 × 2560</span>
          </span>
        </DropZone>

        <SegmentedControl
          label="Fit to Kindle 1600 × 2560"
          options={FIT_OPTIONS}
          value={state.fit}
          onChange={actions.setFit}
        />

        <div className="flex flex-col gap-6">
          <span className="plate">Source</span>
          <span className="text-sm text-ink-muted">{coverSourceLine(state)}</span>
        </div>

        {lowRes && <Notice>{lowRes}</Notice>}
      </div>

      {settings.showKindlePreview && (
        <div className="wizard-preview">
          <DevicePreview coverUrl={state.coverUrl} fit={state.fit} />
        </div>
      )}
    </div>
  );
}
