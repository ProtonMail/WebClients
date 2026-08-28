import type { MailState } from '../rootReducer';

export type MailStateSlice = Partial<MailState>;

/**
 * Composes a `MailState` out of the slices a test needs, and nothing else.
 *
 * Slices are merged in order, so appending a slice overrides an earlier one. A slice that
 * is not provided is absent from the state, which makes any selector reading it throw
 */
export const buildMailState = (...slices: MailStateSlice[]) => Object.assign({}, ...slices) as MailState;
