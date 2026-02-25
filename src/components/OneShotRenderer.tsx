/** @jsxImportSource react */
import { useApp } from 'ink';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

/** Renders children once then exits the Ink application. */
export function OneShotRenderer({ children }: { readonly children: ReactNode }) {
  const { exit } = useApp();
  useEffect(() => { exit(); }, [exit]);
  return <>{children}</>;
}
