import { useEffect, useId, useState } from 'react';
import { cx } from '../../../lib/cx';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface ChipsInputProps {
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function serializeTags(tags: readonly string[]): string {
  return tags.join(', ');
}

export function ChipsInput({ label, value, placeholder, onChange }: ChipsInputProps) {
  const id = useId();
  const [tags, setTags] = useState(() => parseTags(value));
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setTags(parseTags(value));
  }, [value]);

  const commitDraft = () => {
    const nextTag = draft.trim();
    if (!nextTag) return;
    const nextTags = tags.includes(nextTag) ? tags : [...tags, nextTag];
    setTags(nextTags);
    setDraft('');
    onChange(serializeTags(nextTags));
  };

  const removeTag = (tagToRemove: string) => {
    const nextTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(nextTags);
    onChange(serializeTags(nextTags));
  };

  return (
    <div className="col-span-full flex flex-col gap-6">
      <label className="plate" htmlFor={id}>
        {label}
      </label>
      <div className={cx('chips-input', FOCUS)}>
        {tags.map((tag) => (
          <span className="chip" key={tag}>
            {tag}
            <button
              type="button"
              className="chip-remove"
              onClick={() => {
                removeTag(tag);
              }}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          placeholder={tags.length === 0 ? placeholder : 'Add a subject'}
          onChange={(event) => {
            setDraft(event.target.value.replace(/,/g, ''));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commitDraft();
            } else if (event.key === 'Backspace' && !draft && tags.length > 0) {
              removeTag(tags[tags.length - 1] ?? '');
            }
          }}
          onBlur={commitDraft}
          className="chip-input"
        />
      </div>
    </div>
  );
}
