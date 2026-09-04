import { useId, useState, type DragEvent, type ReactNode } from 'react';
import { cx } from '../../../lib/cx';

interface DropZoneProps {
  readonly accept: string;
  readonly onFile: (file: File) => void;
  readonly children: ReactNode;
  /** `tall` is the step 1 book target; `inline` is the step 2 image target. */
  readonly variant: 'tall' | 'inline';
}

/**
 * A label wrapping a screen-reader-only file input. `sr-only` rather than
 * `opacity: 0` matters: the input keeps its place in the tab order, so the drop
 * target is operable from the keyboard, and the ring is drawn on the label via
 * `has-[:focus-visible]` so it looks like the thing that has focus.
 */
export function DropZone({ accept, onFile, children, variant }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => {
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={cx(
        'relative flex cursor-pointer rounded-md border border-dashed',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        'has-[:focus-visible]:outline-accent',
        variant === 'tall'
          ? 'flex-col items-start gap-12 px-26 py-34'
          : 'items-center gap-14 px-20 py-18',
        isDragging
          ? 'border-accent bg-drop-hover'
          : 'border-line-dashed bg-drop hover:border-accent hover:bg-drop-hover',
      )}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          // Allow re-choosing the same file after a failed read.
          event.target.value = '';
        }}
      />
      {children}
    </label>
  );
}
