import type { createRef } from 'react';

/**
 * `RefObject` for a ref that is read and also passed to a `ref` attribute. It is `RefObject<T>` with the
 * React 18 types, whose `ref` attribute rejects `RefObject<T | null>`, and `RefObject<T | null>` with the
 * React 19 types. Replace it with `RefObject<T | null>` once on React 19.
 */
export type RefObjectReact18Compat<T> = ReturnType<typeof createRef<T>>;
