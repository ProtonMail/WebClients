import type { KeyboardEvent } from 'react';

/**
 * Returns `true` while an IME (Chinese/Japanese/Korean, etc.) composition is in progress.
 *
 * During composition, keys like Enter confirm the candidate character rather than
 * triggering submit/keyboard shortcuts, so callers should bail out of their key
 * handlers when this returns `true`.
 *
 * `keyCode === 229` is a fallback for browsers that don't set `isComposing` reliably.
 */
export const isImeComposing = (e: KeyboardEvent): boolean => e.nativeEvent.isComposing || e.keyCode === 229;
