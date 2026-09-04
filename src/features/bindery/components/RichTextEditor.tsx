import { useEffect, useId, useRef } from 'react';
import { cx } from '../../../lib/cx';
import { sanitizeHtml } from '../../../lib/sanitizeHtml';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface RichTextEditorProps {
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}

export function RichTextEditor({ label, value, placeholder, onChange }: RichTextEditorProps) {
  const id = useId();
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value;
  }, [value]);

  const format = (command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList') => {
    // execCommand is the browser API that preserves the current selection.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(command);
    const next = sanitizeHtml(editor.current?.innerHTML ?? '');
    onChange(next);
    editor.current?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="plate" htmlFor={id}>
        {label}
      </label>
      <div className="rich-text rounded-md border border-line-divider bg-surface">
        <div
          className="flex gap-2 border-b border-line-divider p-4"
          role="toolbar"
          aria-label={`${label} formatting`}
        >
          <button
            type="button"
            className={cx('btn btn-ghost rich-text-tool', FOCUS)}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              format('bold');
            }}
            aria-label="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={cx('btn btn-ghost rich-text-tool', FOCUS)}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              format('italic');
            }}
            aria-label="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={cx('btn btn-ghost rich-text-tool', FOCUS)}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              format('underline');
            }}
            aria-label="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className={cx('btn btn-ghost rich-text-tool', FOCUS)}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              format('insertUnorderedList');
            }}
            aria-label="Bulleted list"
          >
            •
          </button>
        </div>
        <div
          id={id}
          ref={editor}
          contentEditable
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          className={cx('rich-text-editor input', FOCUS)}
          suppressContentEditableWarning
          onInput={() => {
            onChange(sanitizeHtml(editor.current?.innerHTML ?? ''));
          }}
        />
      </div>
    </div>
  );
}
