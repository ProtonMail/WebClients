import { vi } from 'vitest';

export const proxy = (fn: unknown) => fn;
export const wrap = vi.fn(() => ({}));
export const expose = vi.fn();
