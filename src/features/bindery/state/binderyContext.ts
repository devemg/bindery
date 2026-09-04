import { createContext, useContext } from 'react';
import type { Bindery } from './useBindery';

export const BinderyContext = createContext<Bindery | null>(null);

/** The wizard's state and actions, so steps need no prop drilling. */
export function useBinderyContext(): Bindery {
  const bindery = useContext(BinderyContext);
  if (!bindery) throw new Error('useBinderyContext must be used inside a <BinderyProvider>.');
  return bindery;
}
