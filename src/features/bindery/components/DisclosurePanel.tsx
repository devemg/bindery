import { useId, type ReactNode } from 'react';
import { cx } from '../../../lib/cx';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface DisclosurePanelProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly openLabel: string;
  readonly closedLabel: string;
  readonly children: ReactNode;
}

/** The caret rotates rather than swapping glyphs, over 140ms. */
export function DisclosurePanel({
  isOpen,
  onToggle,
  openLabel,
  closedLabel,
  children,
}: DisclosurePanelProps) {
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cx(
          'flex cursor-pointer items-center gap-8 self-start border-0 bg-transparent px-0 py-4',
          'font-body text-prose text-accent-400 hover:text-accent-300',
          FOCUS,
        )}
      >
        <span
          aria-hidden="true"
          className={cx('inline-block transition-transform', isOpen && 'rotate-90')}
        >
          ▸
        </span>
        <span>{isOpen ? openLabel : closedLabel}</span>
      </button>

      <div id={panelId} hidden={!isOpen}>
        {children}
      </div>
    </>
  );
}
