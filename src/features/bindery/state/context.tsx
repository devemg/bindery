import type { ReactNode } from 'react';
import { BinderyContext } from './binderyContext';
import { DEFAULT_SETTINGS, type BinderySettings } from './types';
import { useBindery } from './useBindery';

export function BinderyProvider({
  children,
  settings = DEFAULT_SETTINGS,
}: {
  children: ReactNode;
  settings?: BinderySettings;
}) {
  // `useBindery` memoises the value, so a step panel deep in the tree does not
  // re-render because an unrelated part of the wizard changed identity.
  const bindery = useBindery(settings);
  return <BinderyContext.Provider value={bindery}>{children}</BinderyContext.Provider>;
}
