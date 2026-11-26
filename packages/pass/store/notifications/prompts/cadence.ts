import type { Maybe } from '../../../types/utils';
import type { PromptDismissal } from './types';

/** Graduated snooze policy for a prompt definition: `cadence[i]` (in
 * seconds) is the snooze applied after the (i+1)-th dismissal. Once
 * the ledger count exhausts the list, prompting stops. An empty list
 * makes the prompt one-shot: dismissed once, never re-prompted. */
export type PromptCadence = number[];

/** 6419's banner policy: 2 dismissals, snoozed 2 weeks each */
export const BANNER_CADENCE = [2 * 7 * 24 * 3_600];
/** 6448's on-page policy: snooze 1 day, then 2 days, then stop */
export const ONPAGE_CADENCE = [24 * 3_600, 2 * 24 * 3_600];

/** Resolves whether a prompt with the given dismissal ledger entry
 * should be re-prompted, according to its cadence policy. A prompt
 * with no ledger entry was never dismissed: always eligible. */
export const shouldPrompt = (dismissal: Maybe<PromptDismissal>, cadence: PromptCadence, now: number): boolean => {
    if (!dismissal || dismissal.count === 0) return true;
    if (dismissal.count > cadence.length) return false;
    return now - dismissal.lastDismissedAt > cadence[dismissal.count - 1];
};
