import { Logo } from './Logo';

export function Header() {
  return (
    <header className="rule-fade-b flex items-end justify-between gap-24 pb-18">
      <div className="flex items-start gap-16">
        <Logo />
        <div className="flex flex-col gap-6">
          <span className="plate text-ink-dim">Bindery — epub to Kindle</span>
          <h1 className="font-heading text-h1 font-normal tracking-title">Rebind a book</h1>
        </div>
      </div>
      <p className="max-w-aside text-pretty text-prose text-ink-dim">
        Replace the portrait, correct the record, and send one clean file to your Kindle.
      </p>
    </header>
  );
}
