import { useId } from 'react';

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface SegmentedControlProps<T extends string> {
  readonly label: string;
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

/**
 * Real radio inputs behind the segments, so arrow keys move between options and
 * the group announces itself as one control. The selected and unselected faces
 * are painted by `.seg-opt` from the stylesheet, keyed off `:has(:checked)`.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const groupName = useId();
  const labelId = `${groupName}-label`;

  return (
    <div className="flex flex-col gap-8">
      <span className="plate" id={labelId}>
        {label}
      </span>
      <div className="seg self-start" role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => (
          <label key={option.value} className="seg-opt">
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
