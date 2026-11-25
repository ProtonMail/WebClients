import type { ReactNode } from 'react';

/**
 * Factory-friendly twin of src/Portal/__mocks__/Portal.tsx.
 * Usage: vi.mock('@proton/atoms/Portal/Portal', async () => await import('@proton/atoms/testing/Portal'));
 */
export const Portal = ({ children }: { children?: ReactNode }) => children;
