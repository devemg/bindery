import { useId } from 'react';
import { cx } from '../../../lib/cx';
import type { MetadataFieldSpec } from '../../../lib/epub/types';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface FieldRowProps {
  readonly spec: MetadataFieldSpec;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/**
 * One labelled input, built from the field descriptor rather than from a list
 * of props repeated per field — the form and the OPF writer read the same
 * definition, so they cannot drift apart.
 */
export function FieldRow({ spec, value, onChange }: FieldRowProps) {
  const id = useId();

  return (
    <div className={cx('flex flex-col gap-6', spec.fullWidth && 'col-span-full')}>
      <label className="plate" htmlFor={id}>
        {spec.label}
      </label>
      {spec.control === 'textarea' ? (
        <textarea
          id={id}
          rows={5}
          className={cx('input', FOCUS)}
          placeholder={spec.placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      ) : (
        <input
          id={id}
          type="text"
          className={cx('input', FOCUS)}
          placeholder={spec.placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}
    </div>
  );
}
