import { CORE_FIELDS, EXTRA_FIELDS, type ReadingDirection } from '../../../lib/epub/types';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { FieldRow } from '../components/FieldRow';
import { SegmentedControl, type SegmentOption } from '../components/SegmentedControl';
import { useBinderyContext } from '../state/binderyContext';

const DIRECTION_OPTIONS: readonly SegmentOption<ReadingDirection>[] = [
  { value: 'ltr', label: 'Left to right' },
  { value: 'rtl', label: 'Right to left' },
];

export function RecordStep() {
  const { state, actions } = useBinderyContext();

  return (
    <div className="flex max-w-record flex-col gap-20">
      <h2 className="font-heading text-h2 font-normal">The record</h2>

      {CORE_FIELDS.map((spec) => (
        <FieldRow
          key={spec.key}
          spec={spec}
          value={state.meta[spec.key]}
          onChange={(value) => {
            actions.setField(spec.key, value);
          }}
        />
      ))}

      <DisclosurePanel
        isOpen={state.showMore}
        onToggle={actions.toggleDisclosure}
        closedLabel="Series, language, publisher and six more"
        openLabel="Fewer fields"
      >
        <div className="grid grid-cols-pair gap-x-20 gap-y-16 rounded-md bg-panel p-20 shadow-sm">
          {EXTRA_FIELDS.map((spec) => (
            <FieldRow
              key={spec.key}
              spec={spec}
              value={state.meta[spec.key]}
              onChange={(value) => {
                actions.setField(spec.key, value);
              }}
            />
          ))}

          <div className="col-span-full">
            <SegmentedControl
              label="Reading order"
              options={DIRECTION_OPTIONS}
              value={state.rtl ? 'rtl' : 'ltr'}
              onChange={actions.setDirection}
            />
          </div>
        </div>
      </DisclosurePanel>
    </div>
  );
}
