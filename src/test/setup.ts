import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

/*
 * jsdom implements neither object URLs nor canvas. The engine's canvas work is
 * covered by pure geometry tests and by the Playwright run in a real browser;
 * here we only need the two APIs to exist so components can mount.
 */
if (typeof URL.createObjectURL !== 'function') {
  let counter = 0;
  URL.createObjectURL = () => `blob:bindery/${String(++counter)}`;
  URL.revokeObjectURL = () => undefined;
}
