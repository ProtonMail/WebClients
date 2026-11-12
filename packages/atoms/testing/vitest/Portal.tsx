import type { ReactNode } from 'react';

/**
 * Vitest twin of src/Portal/__mocks__/Portal.tsx (used by Jest consumers).
 * Usage: vi.mock('@proton/atoms/Portal/Portal', async () => await import('@proton/atoms/testing/vitest/Portal'));
 */
export const Portal = ({ children }: { children?: ReactNode }) => children;
